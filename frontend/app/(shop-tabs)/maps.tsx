// File: maps.tsx
// Description: Professional maps screen with shop pins and detailed popup modals

import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView, 
  StatusBar,
  Dimensions,
  TextInput,
  Modal,
  Animated
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { apiClient, ENDPOINTS } from '../../config/api';
import { router } from 'expo-router';
import { formatImageUrl } from '../../utils/imageUtils';
import { formatTimeForDisplay, isShopCurrentlyOpen } from '../../utils/timeUtils';
import { WebView } from 'react-native-webview';

const { width, height } = Dimensions.get('window');

interface Shop {
  id: string;
  shopName: string;
  shopLocation: string;
  latitude: number;
  longitude: number;
  rating: number;
  isAvailable: boolean;
  openingTime: string;
  closingTime: string;
  shopType: string;
  shopImage: string;
  totalReviews: number;
  ownerName: string;
}

export default function MapsScreen() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredShops, setFilteredShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showShopModal, setShowShopModal] = useState(false);
  const [mapError, setMapError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    fetchShops();
    
    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.log('[Maps] Timeout reached, stopping loading');
        setIsLoading(false);
      }
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    filterShops();
  }, [searchQuery, shops]);

  useFocusEffect(
    React.useCallback(() => {
      fetchShops();
    }, [])
  );

  // Fetch approved shops from API
  const fetchShops = async () => {
    try {
      setIsLoading(true);
      console.log('[fetchShops] Starting API call...');
      
      const token = await AsyncStorage.getItem('token');
      console.log('[fetchShops] Token exists:', !!token);
      
      if (!token) {
        console.log('[fetchShops] No token found, redirecting to login');
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      console.log('[fetchShops] Making API call to:', ENDPOINTS.SHOP.MAP);
      console.log('[fetchShops] API Base URL:', process.env.EXPO_PUBLIC_API_URL);
      
      const response = await apiClient.get(ENDPOINTS.SHOP.MAP, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('[fetchShops] API Response:', response.data);
      
      // Ensure we always set shops data, even if empty
      const shopsData = response.data || [];
      setShops(shopsData);
      setFilteredShops(shopsData);
      console.log(`[fetchShops] Loaded ${shopsData.length} approved shops for map`);
      
      if (shopsData.length > 0) {
        console.log('[fetchShops] First shop:', shopsData[0]);
      }
      
    } catch (error: any) {
      console.error('[fetchShops] Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      });
      
      setShops([]);
      setFilteredShops([]);
      console.log('[fetchShops] Setting empty shops array due to error');
    } finally {
      setIsLoading(false);
      console.log('[fetchShops] Finished, loading set to false');
    }
  };

  const filterShops = () => {
    if (!searchQuery.trim()) {
      setFilteredShops(shops);
    } else {
      const filtered = shops.filter(shop =>
        shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.shopType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shop.shopLocation.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredShops(filtered);
    }
  };

  const handleMarkerPress = (shop: Shop) => {
    setSelectedShop(shop);
    setShowShopModal(true);
    
    // Animate modal in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleCloseModal = () => {
    // Animate modal out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
    setShowShopModal(false);
    setSelectedShop(null);
    });
  };

  const handleShopProfilePress = (shop: Shop) => {
    handleCloseModal();
    router.push(`/shop-profile/${shop.id}`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesome5
          key={i}
          name="star"
          size={12}
          color={i <= rating ? '#FFD700' : '#E0E0E0'}
        />
      );
    }
    return stars;
  };

  // Using the new time utility function
  const formatTime = (time: string) => formatTimeForDisplay(time);

  // Using the new time utility function
  const checkShopOpen = (openingTime: string, closingTime: string) => isShopCurrentlyOpen(openingTime, closingTime);

  const generateMapHTML = (shops: Shop[]) => {
    console.log('[Maps] Generating map HTML for', shops.length, 'shops');
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="initial-scale=1.0, user-scalable=no">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              width: 100%;
            }
            #map {
              height: 100%;
              width: 100%;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script>
            function initMap() {
              try {
                console.log('Starting map initialization...');
                
                // Initialize the map
                const map = L.map('map').setView([10.3926152, 123.6520387], 12);
                console.log('Map created successfully');
                
                // Add tile layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors'
                }).addTo(map);
                console.log('Tile layer added');
                
                // Add a simple test marker
                const testMarker = L.marker([10.3926152, 123.6520387]).addTo(map);
                testMarker.bindPopup('<div style="padding: 15px; background: white; border: 2px solid #333; border-radius: 10px;"><h3>Test Marker</h3><p>Map is working!</p></div>');
                console.log('Test marker added');
                
                // Add shop markers if available
                if (${shops.length} > 0) {
                  console.log('Adding ${shops.length} shop markers...');
                  
                  ${shops.map(shop => `
                    try {
                      const marker${shop.id} = L.marker([${shop.latitude}, ${shop.longitude}]).addTo(map);
                      
                      // Simple popup content with image, basic info, and simple status
                      const popupContent = '<div style="padding: 15px; background: white; border-radius: 15px; min-width: 280px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);"><img src="${formatImageUrl(shop.shopImage) || 'https://via.placeholder.com/280x120/2C3E50/FFFFFF?text=No+Image'}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 10px; margin-bottom: 10px;" alt="Shop" /><h3 style="margin: 0 0 10px 0; color: #333; font-size: 18px; font-weight: 700;">${shop.shopName}</h3><p style="margin: 5px 0; color: #666; font-size: 14px;">Type: ${shop.shopType}</p><p style="margin: 5px 0; color: #666; font-size: 14px;">Hours: ${shop.openingTime && shop.closingTime ? shop.openingTime + ' - ' + shop.closingTime : 'Not available'}</p><div style="margin-top: 10px;"><span style="color: #3498DB; font-size: 14px; font-weight: 600;">📍 Click for more details</span></div></div>';
                      
                      marker${shop.id}.bindPopup(popupContent);
                      
                      // Add click event for debugging
                      marker${shop.id}.on('click', function() {
                        console.log('Marker clicked for shop: ${shop.shopName}');
                        console.log('Opening popup for shop: ${shop.shopName}');
                      });
                      
                      console.log('Added marker for shop: ${shop.shopName}');
                    } catch (error) {
                      console.error('Error adding marker for shop ${shop.shopName}:', error);
                    }
                  `).join('')}
                  
                  console.log('All shop markers added');
                } else {
                  console.log('No shops to display');
                }
                
                console.log('Map initialization complete');
                
              } catch (error) {
                console.error('Error initializing map:', error);
                document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: red;"><h3>Map Error</h3><p>' + error.message + '</p></div>';
              }
            }
            
            // Wait for Leaflet to load
            if (typeof L === 'undefined') {
              document.getElementById('map').innerHTML = '<div style="padding: 20px; text-align: center; color: red;"><h3>Loading Map...</h3><p>Please wait while the map loads.</p></div>';
              setTimeout(initMap, 1000);
            } else {
              initMap();
            }
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" translucent />
      
             {/* Header with Search */}
       <View style={styles.header}>
        <Text style={styles.title}>Pet Shops Map</Text>
         
         <View style={styles.searchContainer}>
           <FontAwesome5 name="search" size={16} color="#666666" style={styles.searchIcon} />
           <TextInput
             style={styles.searchInput}
             placeholder="Search shop here"
             placeholderTextColor="#999999"
             value={searchQuery}
             onChangeText={setSearchQuery}
           />
           {searchQuery.length > 0 && (
             <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
               <FontAwesome5 name="times" size={14} color="#666666" />
             </TouchableOpacity>
           )}
         </View>
       </View>

             {/* Loading Overlay */}
       {isLoading && (
         <View style={styles.loadingOverlay}>
           <View style={styles.loadingContent}>
            <FontAwesome5 name="spinner" size={20} color="#666666" style={styles.spinningIcon} />
            <Text style={styles.loadingText}>Loading approved shops...</Text>
           </View>
         </View>
       )}

      {/* Map */}
      <View style={styles.mapContainer}>
        {/* Interactive Map Web View */}
        <View style={styles.mapWrapper}>
                     <WebView
             source={{
               html: generateMapHTML(filteredShops),
             }}
             style={styles.webMap}
             javaScriptEnabled={true}
             domStorageEnabled={true}
             startInLoadingState={true}
             onError={() => {
               console.log('[Maps] WebView failed to load, showing fallback');
               setMapError(true);
             }}
             onMessage={(event) => {
               console.log('[Maps] WebView message:', event.nativeEvent.data);
             }}
             onLoadEnd={() => {
               console.log('[Maps] WebView loaded successfully');
             }}
             renderLoading={() => (
               <View style={styles.mapLoading}>
                 <FontAwesome5 name="spinner" size={20} color="#4CAF50" />
                 <Text style={styles.mapLoadingText}>Loading interactive map...</Text>
                  </View>
             )}
           />
                </View>
              </View>

      {/* Map Error Fallback */}
      {mapError && (
        <View style={styles.mapErrorContainer}>
          <FontAwesome5 name="map" size={50} color="#E0E0E0" />
          <Text style={styles.mapErrorText}>Map Loading Failed</Text>
          <Text style={styles.mapErrorSubtext}>
            Please check your internet connection and try again
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setMapError(false);
              fetchShops();
            }}
          >
            <FontAwesome5 name="redo" size={16} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* No Shops Message */}
      {!isLoading && !mapError && shops.length === 0 && (
        <View style={styles.noShopsContainer}>
          <FontAwesome5 name="store" size={50} color="#E0E0E0" />
          <Text style={styles.noShopsText}>No Approved Pet Shops</Text>
          <Text style={styles.noShopsSubtext}>
            No approved pet shops are currently available in your area
          </Text>
        </View>
      )}

      {/* No Search Results */}
      {!isLoading && !mapError && searchQuery.trim() !== '' && filteredShops.length === 0 && shops.length > 0 && (
        <View style={styles.noShopsContainer}>
          <FontAwesome5 name="search" size={40} color="#E0E0E0" />
          <Text style={styles.noShopsText}>No shops found</Text>
          <Text style={styles.noShopsSubtext}>
            Try adjusting your search terms
          </Text>
        </View>
      )}

      

      {/* Shop Details Modal */}
      <Modal
        visible={showShopModal}
        animationType="none"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContent,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {selectedShop && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Shop Details</Text>
                  <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                    <FontAwesome5 name="times" size={20} color="#666666" />
                  </TouchableOpacity>
                </View>

                {/* Shop Image and Basic Info Row */}
                <View style={styles.imageInfoRow}>
                  {/* Shop Image */}
                <Image
                  source={
                    selectedShop.shopImage
                        ? { uri: formatImageUrl(selectedShop.shopImage) }
                      : require('../../assets/images/pet.png')
                  }
                  style={styles.shopImage}
                />

                  {/* Operating Hours */}
                  <View style={styles.basicInfo}>
                    <Text style={styles.hoursText}>
                      {selectedShop.openingTime && selectedShop.closingTime 
                        ? `${formatTime(selectedShop.openingTime)} - ${formatTime(selectedShop.closingTime)}`
                        : 'Hours not available'
                      }
                    </Text>
                  </View>
                </View>

                {/* Shop Name and Type */}
                <Text style={styles.shopName}>{selectedShop.shopName}</Text>
                <Text style={styles.shopType}>{selectedShop.shopType}</Text>

                {/* Status Button */}
                <View style={styles.statusButtonContainer}>
                  <View style={styles.statusButton}>
                    <Text style={styles.statusButtonText}>
                      {isShopCurrentlyOpen(selectedShop.openingTime, selectedShop.closingTime) ? 'Open' : 'Closed'}
                    </Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: isShopCurrentlyOpen(selectedShop.openingTime, selectedShop.closingTime) ? '#4CAF50' : '#F44336' }]} />
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() => handleShopProfilePress(selectedShop)}
                >
                  <FontAwesome5 name="store" size={16} color="#FFFFFF" />
                  <Text style={styles.viewProfileButtonText}>View Full Profile</Text>
                </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 10,
  },
  spinningIcon: {
    transform: [{ rotate: '360deg' }],
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#2C2C2C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    minHeight: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#0E0F0F',
  },
  clearButton: {
    padding: 5,
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  mapWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  webMap: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  mapLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4CAF50',
  },


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
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  shopImage: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    marginBottom: 20,
  },
  shopName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0E0F0F',
    marginBottom: 5,
    textAlign: 'center',
  },
  shopType: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 5,
    textAlign: 'center',
  },
  shopLocation: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 20,
    textAlign: 'center',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginRight: 10,
  },
  ratingText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  infoSection: {
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtons: {
    alignItems: 'center',
  },
  viewProfileButton: {
    backgroundColor: '#0E0F0F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    minWidth: 200,
  },
  viewProfileButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  noShopsContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noShopsText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  noShopsSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  mapErrorContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapErrorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  mapErrorSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#0E0F0F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Missing styles for modal components
  imageInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  basicInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'space-between',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0E0F0F',
  },
  ratingSlash: {
    fontSize: 16,
    color: '#666666',
    marginHorizontal: 2,
  },
  ratingMax: {
    fontSize: 16,
    color: '#666666',
    marginRight: 5,
  },
  ratingStar: {
    marginLeft: 5,
  },
  hoursText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  statusButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  statusButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E0F0F',
  },
});
