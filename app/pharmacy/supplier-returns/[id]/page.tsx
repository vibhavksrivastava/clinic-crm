interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function SupplierReturnViewPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">
        Supplier Return Details
      </h1>

      <p className="mt-4">
        Return ID: {id}
      </p>
    </div>
  );
}