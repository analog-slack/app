BEGIN;

CREATE TYPE "WorkspaceMemberRole" AS ENUM ('admin', 'member');

ALTER TABLE "workspace_members" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "workspace_members"
    ALTER COLUMN "role" TYPE "WorkspaceMemberRole"
        USING (CASE WHEN "role" = 'admin' THEN 'admin' ELSE 'member' END)::"WorkspaceMemberRole",
    ALTER COLUMN "role" SET DEFAULT 'member',
    ALTER COLUMN "role" SET NOT NULL;

INSERT INTO "workspace_members" ("id", "workspace_id", "user_id", "role")
SELECT gen_random_uuid(), "id", "owner_id", 'member' FROM "workspaces"
ON CONFLICT ("workspace_id", "user_id") DO NOTHING;

CREATE INDEX "workspace_members_user_id_idx" ON "workspace_members"("user_id");

CREATE TABLE "workspace_invite_links" (
    "id" UUID NOT NULL,
    "workspace_id" UUID NOT NULL,
    "invited_by" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL,
    "expires_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),
    CONSTRAINT "workspace_invite_links_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "workspace_invite_links_workspace_id_fkey"
        FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "workspace_invite_links_invited_by_fkey"
        FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "workspace_invite_links_token_hash_key" ON "workspace_invite_links"("token_hash");
CREATE INDEX "workspace_invite_links_workspace_id_created_at_idx" ON "workspace_invite_links"("workspace_id", "created_at");

COMMIT;
