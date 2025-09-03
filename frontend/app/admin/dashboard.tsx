// File: dashboard.tsx
// Description: Modern admin dashboard with statistics, charts, and data visualization

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, ENDPOINTS } from '../../config/api';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalUsers: number;
  totalPets: number;
  totalShops: number;
  pendingApplications: number;
  activeUsers: number;
  totalTasks: number;
}

interface ChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPets: 0,
    totalShops: 0,
    pendingApplications: 0,
    activeUsers: 0,
    totalTasks: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [userChartData, setUserChartData] = useState<ChartData[]>([]);
  const [petChartData, setPetChartData] = useState<ChartData[]>([]);

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
        router.replace('/auth/login');
        return;
      }
      
      // Fetch all data in parallel
      const [usersResponse, petsResponse, shopsResponse, applicationsResponse] = await Promise.all([
        apiClient.get(ENDPOINTS.ADMIN.USERS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiClient.get(ENDPOINTS.ADMIN.PETS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiClient.get(ENDPOINTS.SHOP.LIST, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiClient.get(ENDPOINTS.ADMIN.APPLICATIONS, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const users = usersResponse.data;
      const pets = petsResponse.data;
      const shops = shopsResponse.data;
      const applications = applicationsResponse.data;

      // Calculate statistics
      const totalUsers = users.length;
      const totalPets = pets.length;
      const totalShops = shops.length;
      const pendingApplications = applications.filter((app: any) => app.status === 'pending').length;
      const activeUsers = users.filter((user: any) => user.isActive !== false).length;
      const totalTasks = pets.reduce((acc: number, pet: any) => acc + (pet.tasks?.length || 0), 0);

      setStats({
        totalUsers,
        totalPets,
        totalShops,
        pendingApplications,
        activeUsers,
        totalTasks,
      });

      // Prepare chart data
      const userTypes = [
        { name: 'Regular Users', count: users.filter((u: any) => !u.isShopOwner).length, color: '#4ECDC4' },
        { name: 'Shop Owners', count: users.filter((u: any) => u.isShopOwner).length, color: '#96CEB4' },
      ];

      const petTypes = pets.reduce((acc: any, pet: any) => {
        const type = pet.type || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      const petChartData = Object.entries(petTypes).map(([type, count], index) => ({
        name: type,
        population: count as number,
        color: ['#FF6B6B', '#4ECDC4', '#96CEB4', '#FFEAA7', '#DDA0DD'][index % 5],
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));

      const userChartData = userTypes.map((type, index) => ({
        name: type.name,
        population: type.count,
        color: type.color,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
      }));

      setUserChartData(userChartData);
      setPetChartData(petChartData);

    } catch (error: any) {
      console.error('[fetchDashboardData] Error:', error.message, error.stack);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <FontAwesome5 name={icon} size={20} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <FontAwesome5 name="chevron-right" size={12} color="#CCCCCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>🏠 Admin Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome! Manage your PetHub system from here</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={async () => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await AsyncStorage.removeItem('token');
                      await AsyncStorage.removeItem('user');
                      router.replace('/auth/login');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to logout');
                    }
                  }
                }
              ]
            );
          }}
        >
          <FontAwesome5 name="sign-out-alt" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="users"
            color="#4ECDC4"
            onPress={() => router.push('/admin/users')}
          />
          <StatCard
            title="Total Pets"
            value={stats.totalPets}
            icon="paw"
            color="#96CEB4"
            onPress={() => router.push('/admin/pets')}
          />
          <StatCard
            title="Pet Shops"
            value={stats.totalShops}
            icon="store"
            color="#FFEAA7"
            onPress={() => router.push('/admin/shops')}
          />
          <StatCard
            title="Pending Applications"
            value={stats.pendingApplications}
            icon="clipboard-list"
            color="#FF6B6B"
            onPress={() => router.push('/admin/applications')}
          />
        </View>

        {/* Charts Section */}
        <View style={styles.chartsContainer}>
          <Text style={styles.sectionTitle}>📊 User Distribution</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={userChartData}
              width={width - 40}
              height={200}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>

          <Text style={styles.sectionTitle}>🐾 Pet Types Distribution</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={petChartData}
              width={width - 40}
              height={200}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          </View>
        </View>


      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2C2C2C',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    fontWeight: '500',
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 20,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#666666',
  },
  statIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0E0F0F',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '600',
  },
  chartsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0E0F0F',
    marginBottom: 20,
    textAlign: 'left',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

});

