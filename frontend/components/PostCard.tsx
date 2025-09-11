// File: PostCard.tsx
// Description: Enhanced post card component with like, comment, and interaction functionality for both users and shop owners

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatImageUrl } from '../utils/imageUtils';
import { apiClient, ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture: string;
  content: string;
  createdAt: string;
  replies?: Reply[];
}

interface Reply {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture: string;
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  content: string;
  createdAt: string;
  likes: number;
  likesCount?: number;
  commentsCount?: number;
  isLiked: boolean;
  isShopOwner?: boolean;
  shopId?: string;
  shopName?: string;
  user?: {
    fullName: string;
    profilePicture: string;
    id: string;
    isShopOwner: boolean;
  };
  image?: string;
  comments?: Comment[];
  showAllComments?: boolean;
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  currentUserIsShopOwner?: boolean;
  onDeletePost?: (postId: string) => void;
  onLikePost?: (postId: string) => void;
  onUnlikePost?: (postId: string) => void;
  onAddComment?: (postId: string, content: string) => void;
  onToggleComments?: (postId: string) => void;
  showMenuButton?: boolean;
  showInteractions?: boolean;
}

export default function PostCard({ 
  post, 
  currentUserId, 
  currentUserIsShopOwner = false,
  onDeletePost, 
  onLikePost,
  onUnlikePost,
  onAddComment,
  onToggleComments,
  showMenuButton = false,
  showInteractions = true
}: PostCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown time';
    }
  };

  const handleDeletePost = () => {
    if (!onDeletePost) return;
    
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDeletePost(post.id);
            setShowDeleteModal(false);
          },
        },
      ]
    );
  };

  const handleLikePress = () => {
    if (!currentUserId) return;
    
    if (post.isLiked && onUnlikePost) {
      onUnlikePost(post.id);
    } else if (!post.isLiked && onLikePost) {
      onLikePost(post.id);
    }
  };

  const handleCommentPress = () => {
    setShowCommentModal(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !onAddComment) return;
    
    setIsSubmittingComment(true);
    try {
      await onAddComment(post.id, newComment.trim());
      setNewComment('');
      setShowCommentModal(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleToggleComments = () => {
    if (onToggleComments) {
      onToggleComments(post.id);
    }
  };

  const canDeletePost = showMenuButton && currentUserId === post.userId;

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image
            source={
              post.userProfilePicture || post.user?.profilePicture
                ? { uri: formatImageUrl(post.userProfilePicture || post.user?.profilePicture) || '' }
                : require('../assets/images/pet.png')
            }
            style={styles.userAvatar}
            defaultSource={require('../assets/images/pet.png')}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {post.userName || post.user?.fullName || 'Unknown User'}
            </Text>
            <Text style={styles.postTime}>{formatDate(post.createdAt)}</Text>
            {post.shopName && (
              <Text style={styles.shopName}>📍 {post.shopName}</Text>
            )}
          </View>
        </View>
        
        {canDeletePost && (
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowDeleteModal(true)}
          >
            <FontAwesome5 name="ellipsis-h" size={16} color="#666666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Post Content */}
      <Text style={styles.postContent}>{post.content}</Text>

      {/* Post Image */}
      {post.image && (
        <Image
          source={{ uri: formatImageUrl(post.image) || '' }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      {/* Interaction Buttons */}
      {showInteractions && (
        <View style={styles.interactionContainer}>
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={handleLikePress}
            disabled={!currentUserId}
          >
            <FontAwesome5 
              name="heart" 
              size={18} 
              color={post.isLiked ? '#FF4757' : '#666666'}
              solid={post.isLiked}
            />
            <Text style={[styles.interactionText, post.isLiked && styles.likedText]}>
              {post.likes || post.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.interactionButton}
            onPress={handleCommentPress}
            disabled={!currentUserId}
          >
            <FontAwesome5 name="comment" size={18} color="#666666" />
            <Text style={styles.interactionText}>
              {post.commentsCount || post.comments?.length || 0}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Comments Preview */}
      {showInteractions && post.comments && post.comments.length > 0 && (
        <View style={styles.commentsSection}>
          {post.comments.slice(0, post.showAllComments ? undefined : 2).map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <Image
                source={
                  comment.userProfilePicture
                    ? { uri: formatImageUrl(comment.userProfilePicture) || '' }
                    : require('../assets/images/pet.png')
                }
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <Text style={styles.commentUserName}>{comment.userName}</Text>
                <Text style={styles.commentText}>{comment.content}</Text>
              </View>
            </View>
          ))}
          
          {post.comments.length > 2 && !post.showAllComments && (
            <TouchableOpacity onPress={handleToggleComments}>
              <Text style={styles.viewMoreComments}>
                View all {post.comments.length} comments
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Post</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={handleDeletePost}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.commentModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.commentModalContent}>
            <View style={styles.commentModalHeader}>
              <Text style={styles.commentModalTitle}>Add Comment</Text>
              <TouchableOpacity
                onPress={() => setShowCommentModal(false)}
                style={styles.closeButton}
              >
                <FontAwesome5 name="times" size={20} color="#666666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              autoFocus
            />
            
            <View style={styles.commentModalActions}>
              <TouchableOpacity
                style={[styles.commentModalButton, styles.cancelCommentButton]}
                onPress={() => setShowCommentModal(false)}
              >
                <Text style={styles.cancelCommentButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.commentModalButton, 
                  styles.postCommentButton,
                  (!newComment.trim() || isSubmittingComment) && styles.disabledButton
                ]}
                onPress={handleAddComment}
                disabled={!newComment.trim() || isSubmittingComment}
              >
                <Text style={styles.postCommentButtonText}>
                  {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 2,
  },
  shopName: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  menuButton: {
    padding: 8,
  },
  postContent: {
    fontSize: 16,
    color: '#0E0F0F',
    lineHeight: 24,
    marginBottom: 12,
  },
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deleteButton: {
    backgroundColor: '#FF4757',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Interaction styles
  interactionContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 12,
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 4,
  },
  interactionText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
    fontWeight: '500',
  },
  likedText: {
    color: '#FF4757',
  },
  // Comments styles
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 18,
  },
  viewMoreComments: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
    marginTop: 8,
  },
  // Comment modal styles
  commentModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  commentModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 200,
  },
  commentModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
  },
  closeButton: {
    padding: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#0E0F0F',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  commentModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  cancelCommentButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  postCommentButton: {
    backgroundColor: '#4ECDC4',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelCommentButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  postCommentButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
