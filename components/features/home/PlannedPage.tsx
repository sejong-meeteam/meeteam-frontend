type PlannedPageProps = {
  title: string;
};

export default function PlannedPage({ title }: PlannedPageProps) {
  return <h1 className="text-3xl font-bold">{title} 페이지</h1>;
}
