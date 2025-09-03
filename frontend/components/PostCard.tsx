// File: PostCard.tsx
// Description: Simplified post card component for shop owners to display posts with content and images

import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Modal
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { formatImageUrl } from '../utils/imageUtils';

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  userId: string;
  userName: string;
  userProfilePicture?: string;
  content: string;
  createdAt: string;
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
}

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onDeletePost?: (postId: string) => void;
  showMenuButton?: boolean;
}

export default function PostCard({ post, currentUserId, onDeletePost, showMenuButton = false }: PostCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
});
