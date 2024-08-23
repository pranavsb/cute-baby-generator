import * as cdk from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Function, Runtime, Code } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { join } from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkBabyGeneratorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO use lambda proxy integration?
    //https://cdkworkshop.com/20-typescript/30-hello-cdk/400-apigw.html
    const cuteBabyApi = new HttpApi(this, 'CuteBabyGeneratorApi', {
      apiName: 'CuteBabyGeneratorApi',
      corsPreflight: {
        allowMethods: [ CorsHttpMethod.GET ]
      }
    });

    const cuteBabyImageLambda =  
    new Function(this, 'CuteBabyImageLambda', {
      code: Code.fromAsset(join(__dirname, '..', 'dist', 'index.zip')),
      handler: 'index.handler',
      runtime: Runtime.NODEJS_20_X,
    });

    const lambdaIntegration = new HttpLambdaIntegration('CuteBabyLambdaIntegration', cuteBabyImageLambda);
    
    cuteBabyApi.addRoutes({
      path: '/get-cute-baby',
      methods: [ HttpMethod.GET ],
      integration: lambdaIntegration
    });
    // example resource
    // const queue = new sqs.Queue(this, 'CdkBabyGeneratorQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
