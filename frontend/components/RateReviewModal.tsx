// File: RateReviewModal.tsx
// Description: Modal component for users to rate and review shops

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { apiClient } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface RateReviewModalProps {
  visible: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  onReviewSubmitted: () => void;
}

const RateReviewModal: React.FC<RateReviewModalProps> = ({
  visible,
  onClose,
  shopId,
  shopName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleRatingPress(i)}
          style={styles.starButton}
        >
          <FontAwesome5
            name="star"
            size={32}
            color={i <= rating ? '#FFD700' : '#E0E0E0'}
            solid={i <= rating}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    if (!review.trim()) {
      Alert.alert('Error', 'Please write a review');
      return;
    }

    if (review.length > 60) {
      Alert.alert('Error', 'Review must be 60 characters or less');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await apiClient.post(
        '/shop/reviews',
        {
          shopId: parseInt(shopId),
          rating,
          review: review.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.status === 201) {
        Alert.alert(
          'Success! 🎉',
          'Your review has been submitted successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                setRating(0);
                setReview('');
                onClose();
                onReviewSubmitted();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      if (error?.response?.data?.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (rating > 0 || review.trim()) {
      Alert.alert(
        'Discard Review?',
        'Are you sure you want to discard your review?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              setRating(0);
              setReview('');
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate & Review</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <FontAwesome5 name="times" size={20} color="#666666" />
            </TouchableOpacity>
          </View>

          {/* Shop Name */}
          <Text style={styles.shopName}>{shopName}</Text>

          {/* Rating Section */}
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>How would you rate this shop?</Text>
            <View style={styles.starsContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingText}>
              {rating > 0 ? `${rating} star${rating > 1 ? 's' : ''}` : 'Select rating'}
            </Text>
          </View>

          {/* Review Section */}
          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>Write your review</Text>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience with this shop..."
              value={review}
              onChangeText={setReview}
              multiline
              numberOfLines={4}
              maxLength={60}
              placeholderTextColor="#999999"
            />
            <Text style={styles.characterCount}>
              {review.length}/60 characters
            </Text>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (rating === 0 || !review.trim() || isSubmitting) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={rating === 0 || !review.trim() || isSubmitting}
          >
            <FontAwesome5 name="paper-plane" size={16} color="#FFFFFF" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: width - 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  closeButton: {
    padding: 5,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 25,
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 15,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  starButton: {
    marginHorizontal: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  reviewSection: {
    marginBottom: 25,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0E0F0F',
    marginBottom: 10,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#0E0F0F',
    textAlignVertical: 'top',
    minHeight: 100,
    backgroundColor: '#F8F9FA',
  },
  characterCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: '#0E0F0F',
    borderRadius: 25,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
});

export default RateReviewModal;
