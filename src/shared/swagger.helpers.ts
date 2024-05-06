import { INestApplication } from '@nestjs/common';
import config from 'config';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import fs from 'fs';

export function initializeSwaggerDoc(app: INestApplication) {
  const serviceName = config.get<string>('service.name');
  const serviceDescription = config.get<string>('service.description');
  const apiVersion = config.get<string>('service.apiVersion');
  const options = new DocumentBuilder()
    .setTitle(`${serviceName} API spec`)
    .setDescription(
      `${
        serviceDescription || 'API specification for Zaapi service'
      } | [swagger.json](swagger.json)`,
    )
    .setVersion(apiVersion)
    .addServer(
      `${config.get('server.swaggerSchema')}://${config.get(
        'server.hostname',
      )}${config.get('service.baseUrl')}`,
    )
    .addSecurity('x-zp-auth-provider', {
      type: 'apiKey',
      name: 'x-zp-auth-provider',
      in: 'header',
      description: 'Auth Provider',
    })
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options, {
    ignoreGlobalPrefix: true,
  });
  writeSwaggerJSONFile(process.cwd(), document);
  const server = app.getHttpAdapter();
  server.get(
    `${config.get<string>('service.docsBaseUrl')}/swagger.json`,
    (req, res) => {
      // swagger json
      res.json(document);
    },
  );

  SwaggerModule.setup(
    config.get<string>('service.docsBaseUrl'),
    app,
    document,
    {
      swaggerOptions: {
        displayOperationId: true,
        persistAuthorization: true,
      },
      customSiteTitle: serviceName,
    },
  );
}

function writeSwaggerJSONFile(path: string, document: OpenAPIObject) {
  const swaggerFile = `${path}/swagger.json`;
  fs.writeFileSync(swaggerFile, JSON.stringify(document, null, 2), {
    encoding: 'utf8',
  });
}
