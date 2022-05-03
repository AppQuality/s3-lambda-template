import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Vpc } from "aws-cdk-lib/aws-ec2";
import { Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
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
  }
}
