-- A message must belong to exactly one channel or conversation.
ALTER TABLE "messages"
ADD CONSTRAINT "messages_exactly_one_parent_check"
CHECK (("channel_id" IS NOT NULL) <> ("conversation_id" IS NOT NULL));

-- Tasks may only use a status from their own project.
ALTER TABLE "task_statuses"
ADD CONSTRAINT "task_statuses_project_id_id_key" UNIQUE ("project_id", "id");

ALTER TABLE "tasks"
DROP CONSTRAINT "tasks_status_id_fkey";

ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_project_id_status_id_fkey"
FOREIGN KEY ("project_id", "status_id")
REFERENCES "task_statuses"("project_id", "id")
ON DELETE NO ACTION
ON UPDATE NO ACTION;
