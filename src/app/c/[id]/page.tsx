import ChatStudioPage from '@/app/page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedChatRoute({ params }: PageProps) {
  const { id } = await params;
  return <ChatStudioPage initialChatId={id} />;
}
