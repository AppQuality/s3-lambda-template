#!/usr/bin/env node
import "source-map-support/register";

import * as cdk from "aws-cdk-lib";

import { S3LambdaStack } from "../lib/generate-stack";

require("dotenv").config();

const app = new cdk.App();
const envEU = { account: "163482350712", region: "eu-west-1" };

const environments = ["production", "staging"];

environments.forEach((env) => {
  new S3LambdaStack(
    app,
    `${process.env.PROJECT_NAME || ""}-stack-${env}`,
    {
      env: envEU,
    },
    {
      projectName: `${process.env.PROJECT_NAME || ""}-stack-${env}`,
      env: env,
    }
  );
});
