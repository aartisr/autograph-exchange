import type { AutographStorage, ProfileEntry, RequestEntry } from "../service";

interface PrismaProfileDelegate {
  findMany(args?: { where?: { userId?: string } }): Promise<ProfileEntry[]>;
  create(args: { data: Omit<ProfileEntry, "id"> }): Promise<ProfileEntry>;
  update(args: { where: { id: string }; data: Partial<Omit<ProfileEntry, "id">> }): Promise<ProfileEntry>;
}

interface PrismaRequestDelegate {
  findMany(): Promise<RequestEntry[]>;
  create(args: { data: Omit<RequestEntry, "id"> }): Promise<RequestEntry>;
  update(args: { where: { id: string }; data: Partial<Omit<RequestEntry, "id">> }): Promise<RequestEntry>;
}

interface PrismaLikeClient {
  autographProfile: PrismaProfileDelegate;
  autographRequest: PrismaRequestDelegate;
}

export function createPrismaAutographStorage(client: PrismaLikeClient): AutographStorage {
  return {
    listProfiles(context) {
      return client.autographProfile.findMany({
        where: context?.userId ? { userId: context.userId } : undefined,
      });
    },

    saveProfile(profile) {
      if (profile.id) {
        return client.autographProfile.update({
          where: { id: profile.id },
          data: profile,
        });
      }

      return client.autographProfile.create({
        data: profile,
      });
    },

    listRequests() {
      return client.autographRequest.findMany();
    },

    createRequest(request) {
      return client.autographRequest.create({
        data: request,
      });
    },

    updateRequest(requestId, patch) {
      return client.autographRequest.update({
        where: { id: requestId },
        data: patch,
      });
    },
  };
}
