import assert from "assert";
import { kOwnServerErrorCodes, OwnServerError } from "fmdx-core/common/error";
import { getClientTokens } from "fmdx-core/serverHelpers/index";
import { first } from "lodash-es";

export async function getClientToken(params: {
  input: { clientTokenId: string };
}) {
  const { input } = params;
  const { clientTokens } = await getClientTokens({
    args: {
      // @ts-expect-error
      query: {
        id: {
          eq: input.clientTokenId,
        },
      },
    },
  });

  const clientToken = first(clientTokens);
  assert(
    clientToken,
    new OwnServerError("Client token not found", kOwnServerErrorCodes.NotFound)
  );

  if (clientToken) {
    assert(
      clientToken?.id === clientToken.id,
      new OwnServerError("Permission denied", kOwnServerErrorCodes.Unauthorized)
    );
  }

  return { clientToken };
}
