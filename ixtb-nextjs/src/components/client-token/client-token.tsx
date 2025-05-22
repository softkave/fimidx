import { useEncodeClientTokenJWT } from "@/src/lib/clientApi/clientToken";
import { IClientToken } from "fmdx-core/definitions/clientToken";
import { useCallback } from "react";
import { Copyable } from "../internal/copyable";
import { ObfuscateText } from "../internal/obfuscate-text";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { ClientTokenItemMenu } from "./client-token-item-menu";
export interface IClientTokenProps {
  clientToken: IClientToken;
}

export function ClientToken(props: IClientTokenProps) {
  const encodeClientTokenJWT = useEncodeClientTokenJWT({
    clientTokenId: props.clientToken.id,
  });

  const handleEncodeClientTokenJWT = useCallback(async () => {
    await encodeClientTokenJWT.trigger({
      id: props.clientToken.id,
    });
  }, [encodeClientTokenJWT, props.clientToken.id]);

  const { data } = encodeClientTokenJWT;

  return (
    <div className="flex flex-col gap-4 p-4 pt-0">
      <div className="flex justify-between items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold break-all">
            {props.clientToken.name}
          </h1>
        </div>
        <ClientTokenItemMenu
          clientToken={props.clientToken}
          appId={props.clientToken.appId}
        />
      </div>
      <div className="flex flex-col gap-4">
        {props.clientToken.description && (
          <p className="text-muted-foreground">
            {props.clientToken.description}
          </p>
        )}
        <Separator />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Org ID
            </h3>
            <Copyable produceText={() => props.clientToken.orgId}>
              <pre className="text-sm text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap break-all">
                <code>{props.clientToken.orgId}</code>
              </pre>
            </Copyable>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              App ID
            </h3>
            <Copyable produceText={() => props.clientToken.appId}>
              <pre className="text-sm text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap break-all">
                <code>{props.clientToken.appId}</code>
              </pre>
            </Copyable>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-md font-medium">Encode Token</h3>
            <Button
              onClick={handleEncodeClientTokenJWT}
              disabled={encodeClientTokenJWT.isMutating}
              variant="outline"
              type="button"
            >
              {encodeClientTokenJWT.isMutating ? "Encoding..." : "Encode"}
            </Button>
          </div>
          {data?.token && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                JWT Token
              </h3>
              <ObfuscateText
                text={data.token}
                canCopy
                render={() => (
                  <pre className="text-sm text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap break-all">
                    <code>{data.token}</code>
                  </pre>
                )}
              />
            </div>
          )}
          {data?.refreshToken && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">
                Refresh Token
              </h3>
              <ObfuscateText
                text={data.refreshToken}
                canCopy
                render={() => (
                  <pre className="text-sm text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap break-all">
                    <code>{data.refreshToken}</code>
                  </pre>
                )}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
