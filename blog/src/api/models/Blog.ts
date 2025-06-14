import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

const CommentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  image: {
    type: String, // URL to the uploaded image
    required: false,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

BlogSchema.methods.toggleLike = function(userId: string) {
  const likes = this.likes.map((id: any) => id.toString());
  const userIdStr = userId.toString();
  
  if (likes.includes(userIdStr)) {
    this.likes = this.likes.filter((id: any) => id.toString() !== userIdStr);
  } else {
    this.likes.push(userId);
  }
  return this.save();
};

export interface Comment {
  _id?: string;
  content: string;
  author: string;
  createdAt?: Date;
}

export interface BlogDocument {
  _id?: ObjectId;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  imageUrl?: string;
  summary?: string;
  isPublished: boolean;
  slug: string;
  views?: number;
  likes: string[];
  comments?: any[];
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  imageUrl?: string;
  summary?: string;
  isPublished: boolean;
  slug: string;
  views: number;
  likes: string[];
  comments: any[];
}

export default mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
