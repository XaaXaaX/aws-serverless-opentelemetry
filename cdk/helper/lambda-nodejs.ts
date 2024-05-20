import { Duration } from "aws-cdk-lib"
import { Architecture, LoggingFormat, Runtime } from "aws-cdk-lib/aws-lambda"
import { BundlingOptions, NodejsFunctionProps, OutputFormat, SourceMapMode } from "aws-cdk-lib/aws-lambda-nodejs"

export const EsbuildNodeBundling: BundlingOptions = {
  platform: 'node',
  format: OutputFormat.ESM,
  mainFields: ['module', 'main'],
  minify: true,
  sourceMap: true,
  sourcesContent: false,
  sourceMapMode: SourceMapMode.INLINE,
  externalModules: [ '@aws-sdk' ],
  commandHooks: {
    beforeBundling: () => [],
    afterBundling: (inputDir, outputDir) => [
      `echo "Copying otel-config to ${outputDir}" from ${inputDir} `,
      `cp ${inputDir}/collector-config.yaml ${outputDir}/`,
    ],
    beforeInstall: () => [],
  },
  banner: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
}

export const LambdaConfiguration: NodejsFunctionProps = {
  runtime: Runtime.NODEJS_20_X,
  architecture: Architecture.ARM_64,
  loggingFormat: LoggingFormat.TEXT,
  timeout: Duration.seconds(10),
  memorySize: 512,
  awsSdkConnectionReuse: false,
  bundling: EsbuildNodeBundling,
}