import { AUTH_ACCESS_COOKIE, AUTH_REFRESH_COOKIE } from '@app/shared';
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function createOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('API')
    .setVersion('0.1.0')
    .addCookieAuth(AUTH_ACCESS_COOKIE, undefined, AUTH_ACCESS_COOKIE)
    .addCookieAuth(AUTH_REFRESH_COOKIE, undefined, AUTH_REFRESH_COOKIE)
    .build();
  return SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controller, method, version) => {
      const operation = `${method.charAt(0).toUpperCase()}${method.slice(1)}`;
      if (controller === 'AuthController') return `Auth${operation}`;
      if (
        controller === 'WorkspacesController' ||
        controller === 'WorkspaceInvitationsController' ||
        controller === 'WorkspaceInvitationPreviewController'
      ) {
        return `Workspaces${operation}`;
      }
      return `${controller}_${method}${version ? `_${version}` : ''}`;
    },
  });
}
