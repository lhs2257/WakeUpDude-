import React, { useState, useEffect } from 'react';
import { Alert, View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import styled from 'styled-components/native';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';

// Import Screen
import GameScreen from './GameScreen';

// --- Configuration ---

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// --- Sound Constants ---
const SOUND_1 = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';
const SOUND_2 = 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg';

// --- Styled Components ---

interface ContainerProps {
  bgColor?: string;
}

const Container = styled.View<ContainerProps>`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.bgColor || '#FFFFFF'};
`;

const TitleText = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: orange;
  margin-bottom: 20px;
`;

const TimeText = styled.Text`
  font-size: 50px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30px;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  color: #666;
  margin-bottom: 10px;
  margin-top: 20px;
`;

const ButtonRow = styled.View`
  flex-direction: row;
  margin-bottom: 20px;
`;

const SoundButton = styled.TouchableOpacity<{ isSelected: boolean }>`
  background-color: ${(props) => (props.isSelected ? '#FF9500' : '#E0E0E0')};
  padding: 10px 20px;
  border-radius: 20px;
  margin: 0 5px;
`;

const SoundButtonText = styled.Text<{ isSelected: boolean }>`
  color: ${(props) => (props.isSelected ? 'white' : '#333')};
  font-weight: bold;
`;

const StyledButton = styled.TouchableOpacity<{ color?: string }>`
  background-color: ${(props) => props.color || '#007AFF'};
  padding: 15px 30px;
  border-radius: 10px;
  margin-bottom: 15px;
  width: 80%;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

// --- Navigation Ref ---
const navigationRef = createNavigationContainerRef();

// --- Components ---

function HomeScreen({ navigation }: any) {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [selectedSound, setSelectedSound] = useState(SOUND_1); // 기본값: 전자음

  // 1. 권한 요청
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '알림 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.');
      }
    })();
  }, []);

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowPicker(false);
    setDate(currentDate);
  };

  // 2. 알람 예약 (선택한 시간 + 소리)
  const scheduleAlarm = async () => {
    const triggerDate = new Date(date);
    const now = new Date();

    if (triggerDate <= now) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "기상 시간!",
          body: "알람을 끄려면 게임을 클리어하세요!",
          sound: true,
          data: {
            screen: 'GameScreen',
            soundUri: selectedSound // 선택된 소리 URL 전달
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        },
      });
      Alert.alert("알람 설정 완료", `${triggerDate.toLocaleString()}에 알람이 울립니다.`);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", `알람 설정 실패: ${e.message}`);
    }
  };

  // 3. 테스트용 5초 뒤 알람 (선택한 소리)
  const scheduleTestAlarm = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "테스트 알람",
          body: "터치하여 게임으로 이동하세요!",
          sound: true,
          data: {
            screen: 'GameScreen',
            soundUri: selectedSound // 선택된 소리 URL 전달
          },
        },
        trigger: {
          seconds: 5,
          repeats: false,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });
      Alert.alert("테스트", "5초 뒤 알림이 울립니다.\n꼭 알림을 '클릭'해서 게임으로 이동해야 소리가 납니다!");
    } catch (e: any) {
      console.error(e);
      Alert.alert("Error", `테스트 알람 실패: ${e.message}`);
    }
  };

  return (
    <Container bgColor="#FFFFFF">
      <TitleText>WakeUp Match</TitleText>

      <TimeText>
        {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </TimeText>

      <StyledButton color="#FF9500" onPress={() => setShowPicker(true)}>
        <ButtonText>시간 변경하기</ButtonText>
      </StyledButton>

      {/* 소리 선택 UI */}
      <SectionTitle>알람음 선택</SectionTitle>
      <ButtonRow>
        <SoundButton
          isSelected={selectedSound === SOUND_1}
          onPress={() => setSelectedSound(SOUND_1)}
        >
          <SoundButtonText isSelected={selectedSound === SOUND_1}>🔔 전자음</SoundButtonText>
        </SoundButton>
        <SoundButton
          isSelected={selectedSound === SOUND_2}
          onPress={() => setSelectedSound(SOUND_2)}
        >
          <SoundButtonText isSelected={selectedSound === SOUND_2}>🎺 기상나팔</SoundButtonText>
        </SoundButton>
      </ButtonRow>

      <StyledButton onPress={scheduleAlarm}>
        <ButtonText>알람 켜기</ButtonText>
      </StyledButton>

      <StyledButton color="#34C759" onPress={() => navigation.navigate('GameScreen', { soundUri: selectedSound })}>
        <ButtonText>게임 화면 미리보기 (소리 테스트)</ButtonText>
      </StyledButton>

      <StyledButton color="#FF3B30" onPress={scheduleTestAlarm}>
        <ButtonText>5초 뒤 알림 테스트</ButtonText>
      </StyledButton>

      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={onChange}
        />
      )}
    </Container>
  );
}

// --- Main App ---

const Stack = createNativeStackNavigator();

export default function App() {

  // 알림 클릭 리스너 설정
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const screen = data.screen;

      // 네비게이션이 준비되었고, 이동할 화면 정보가 있다면 이동
      if (screen && navigationRef.isReady()) {
        // @ts-ignore
        // 데이터 전체를 파라미터로 넘겨줌 (soundUri 포함)
        navigationRef.navigate(screen, data);
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen
          name="HomeScreen"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GameScreen"
          component={GameScreen}
          options={{
            title: '기상 미션',
            headerBackVisible: false, // 뒤로가기 숨김
            gestureEnabled: false,    // 스와이프 방지
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
