import mongoose, { Document } from 'mongoose';
import { ObjectId } from 'mongodb';

// Comment as it exists in the database
export interface CommentDocument {
  _id: ObjectId;
  content: string;
  author: string | ObjectId;
  createdAt: Date;
}

// Comment as it's used in the frontend
export interface Comment {
  _id: string;
  content: string;
  author: string;
  createdAt: Date;
}

// Blog as it exists in the database
export interface BlogDocument extends Document {
  _id: ObjectId;
  title: string;
  content: string;
  author: ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
  summary?: string;
  isPublished: boolean;
  slug?: string;
  views: number;
  likes: string[];
  comments: CommentDocument[];
  tags: string[];
  imageUrl?: string;
}

// Blog as it's used in the frontend
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
  comments: Comment[];
  isFavorited?: boolean; // New property
}

// Database schema for comments
const CommentSchema = new mongoose.Schema({
  _id: {
    type: ObjectId,
    required: true,
    auto: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Database schema for blogs
const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  summary: String,
  isPublished: {
    type: Boolean,
    default: false
  },
  slug: String,
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: [String],
    default: []
  },
  comments: {
    type: [CommentSchema],
    default: []
  },
  tags: {
    type: [String],
    default: []
  },
  imageUrl: String
}, {
  toJSON: {
    virtuals: true,
    transform: function(doc: BlogDocument, ret: any) {
      ret.id = ret._id.toString();
      delete ret.__v;
      if (ret.author && typeof ret.author === 'object' && 'toString' in ret.author) {
        ret.author = ret.author.toString();
      }
      if (Array.isArray(ret.likes)) {
        ret.likes = ret.likes.map((like: string | { _id: ObjectId }) => 
          typeof like === 'object' && like._id ? like._id.toString() : like.toString()
        );
      }
      if (Array.isArray(ret.comments)) {
        ret.comments = ret.comments.map((comment: CommentDocument) => ({
          ...comment,
          _id: comment._id ? comment._id.toString() : undefined,
          author: typeof comment.author === 'object' && 'toString' in comment.author
            ? comment.author.toString()
            : comment.author
        }));
      }
    }
  }
});

// Add compound index for efficient querying
BlogSchema.index({ author: 1, createdAt: -1 });
BlogSchema.index({ isPublished: 1, createdAt: -1 });
BlogSchema.index({ tags: 1 });

const BlogModel = mongoose.models.Blog || mongoose.model<BlogDocument>('Blog', BlogSchema);

export default BlogModel;
