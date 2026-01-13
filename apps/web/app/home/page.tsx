// app/home/page.tsx
import { PageBody, PageHeader } from '@kit/ui/page';
import { DashBoardChat } from './_components/dashBoard-chat';

export default function HomePage() {
  return (
    <>
      <PageBody>
        <PageHeader description={'Assistant intelligent avec RAG'} />
        <DashBoardChat />
      </PageBody>
    </>
  );
}