import { redirect } from "next/navigation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const { searchParams } = new URL(request.url);

  const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN ?? "http://localhost:8080";

  const targetUrl = new URL(`${backendOrigin}/login/oauth2/code/${provider}`);
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  redirect(targetUrl.toString());
}
