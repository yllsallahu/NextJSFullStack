export interface Blog {
    _id?: string;
    title: string;
    body: string;
    authorId: string;
    authorName: string;
    likes: string[]; // Array of user IDs who liked the post
    createdAt: Date;
    updatedAt?: Date;
    isPublished: boolean;
}
