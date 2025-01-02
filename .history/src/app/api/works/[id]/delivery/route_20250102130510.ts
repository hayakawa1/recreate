import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('No file uploaded', { status: 400 });
    }

    // Firebaseにファイルをアップロード
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const storageRef = ref(storage, `deliveries/${params.id}/${file.name}`);
    await uploadBytes(storageRef, buffer);
    const downloadUrl = await getDownloadURL(storageRef);

    // データベースを更新
    const work = await prisma.work.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'delivered',
        deliveryFileUrl: downloadUrl,
      },
    });

    return NextResponse.json(work);
  } catch (error) {
    console.error('Upload error:', error);
    return new NextResponse('Upload failed', { status: 500 });
  }
} 