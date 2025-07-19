import { PageMessage } from "../page-message";

export function ComponentListMessage(props: {
  title: string;
  message: string;
}) {
  return (
    <div className="p-4">
      <PageMessage
        title={props.title}
        message={props.message}
        variant="secondary"
      />
    </div>
  );
}
