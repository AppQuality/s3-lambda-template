import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import {
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import * as path from "path";

import { StackConfig } from "../interfaces/stack-settings";

export class S3LambdaStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: StackProps,
    config?: StackConfig
  ) {
    super(scope, id, props);

    //Check environment type
    const isProd = config?.env === "production";
    const db = isProd
      ? require("./db-config-production.json")
      : require("./db-config-staging.json");

    const bucket = new s3.Bucket(this, `${config?.projectName}-bucket`);

    // create a role for the lambda
    const lambdaRole = new Role(this, `${config?.projectName}-role`, {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        {
          managedPolicyArn:
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        },
        {
          managedPolicyArn:
            "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
        },
      ],
      inlinePolicies: {
        // allow deleting files from the bucket
        "s3-bucket-policy": new PolicyDocument({
          statements: [
            new PolicyStatement({
              resources: [bucket.bucketArn],
              actions: ["s3:DeleteObject"],
              effect: Effect.ALLOW,
            }),
          ],
        }),
      },
    });

    const getExistingVpc = Vpc.fromLookup(this, "ImportVPC", {
      vpcId: "vpc-3e2dcd5a",
    });
    // Create a lambda function to process the queue
    const lambda = new NodejsFunction(this, `${config?.projectName}-lambda`, {
      timeout: Duration.seconds(15),
      runtime: Runtime.NODEJS_14_X,
      handler: "main",
      role: lambdaRole,
      entry: path.join(__dirname, `/../lambda/index.ts`),
      vpc: getExistingVpc,
      environment: {
        ...db,
      },
    });

    lambda.addEventSource(
      new S3EventSource(bucket, {
        events: [s3.EventType.OBJECT_CREATED],
      })
    );
  }
}
