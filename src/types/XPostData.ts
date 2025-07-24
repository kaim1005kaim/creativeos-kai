export interface XPostData {
  id: string;
  url: string;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
  };
  text: string;
  images: string[]; // 最大4件
  videoUrl?: string;
  createdAt: string;
}

export interface XPostMetadata {
  type: 'x-post';
  postData: XPostData;
}