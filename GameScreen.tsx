import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import styled from 'styled-components/native';
import { Audio } from 'expo-av';

// --- Types ---
interface Card {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
}

// --- Constants ---
const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
const DEFAULT_ALARM_SOUND = 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg';

// --- Styled Components ---
const Container = styled.View`
  flex: 1;
  background-color: #F0F0F0;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Header = styled.View`
  margin-bottom: 30px;
  align-items: center;
`;

const TimerText = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: #333;
`;

const GuideText = styled.Text`
  font-size: 16px;
  color: #666;
  margin-top: 10px;
  text-align: center;
`;

const Grid = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
  max-width: 360px;
`;

const CardButton = styled.TouchableOpacity<{ isFlipped: boolean; isMatched: boolean }>`
  width: 70px;
  height: 70px;
  margin: 8px;
  background-color: ${(props) => (props.isFlipped || props.isMatched ? '#FFFFFF' : '#FF9500')};
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  elevation: 5;
  box-shadow: 0px 4px 4px rgba(0,0,0,0.2);
`;

const CardText = styled.Text`
  font-size: 32px;
`;

// --- Component ---
export default function GameScreen({ navigation, route }: any) {
    const [cards, setCards] = useState<Card[]>([]);
    const [selectedCards, setSelectedCards] = useState<Card[]>([]);
    const [timer, setTimer] = useState(0);
    const [isGameActive, setIsGameActive] = useState(false);
    const [sound, setSound] = useState<Audio.Sound | null>(null);

    // Params에서 전달받은 soundUri 확인 (없으면 기본값)
    // const soundUri = route.params?.soundUri || DEFAULT_ALARM_SOUND;
    // -> 실제로는 useEffect 안에서 사용합니다.

    // Initialize Game on Mount
    useEffect(() => {
        startNewGame();
        setIsGameActive(true);
        playAlarmSound();

        return () => {
            stopAlarmSound(); // 화면 나가면 소리 멈춤
        };
    }, []);

    // Play Sound Logic
    const playAlarmSound = async () => {
        try {
            // route.params에서 soundUri 가져오기
            const soundUri = route.params?.soundUri || DEFAULT_ALARM_SOUND;
            console.log('Playing Sound:', soundUri);

            const { sound } = await Audio.Sound.createAsync(
                { uri: soundUri },
                { isLooping: true, shouldPlay: true } // 계속 반복 재생
            );
            setSound(sound);
        } catch (error) {
            console.log('Error playing sound:', error);
        }
    };

    const stopAlarmSound = async () => {
        if (sound) {
            await sound.stopAsync();
            await sound.unloadAsync();
            setSound(null);
        }
    };

    // Timer Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isGameActive) {
            interval = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isGameActive]);

    // Check Win Condition
    useEffect(() => {
        if (cards.length > 0 && cards.every((c) => c.isMatched)) {
            setIsGameActive(false);
            stopAlarmSound(); // 게임 클리어 시 소리 끔

            // Wait a bit for the last card to flip
            setTimeout(() => {
                Alert.alert(
                    "🎉 기상 성공!",
                    `축하합니다! ${timer}초 만에 깼네요!\n이제 하루를 시작해보세요.`,
                    [
                        {
                            text: "상쾌하게 시작하기",
                            onPress: () => navigation.navigate('HomeScreen')
                        }
                    ]
                );
            }, 500);
        }
    }, [cards, timer, navigation]);

    const startNewGame = () => {
        const gameEmojis = [...EMOJIS, ...EMOJIS];
        gameEmojis.sort(() => Math.random() - 0.5);

        const initialCards = gameEmojis.map((emoji, index) => ({
            id: index,
            emoji,
            isFlipped: false,
            isMatched: false,
        }));

        setCards(initialCards);
        setTimer(0);
        setSelectedCards([]);
    };

    const onCardPress = (card: Card) => {
        if (card.isFlipped || card.isMatched || selectedCards.length >= 2) return;

        const newCards = cards.map((c) =>
            c.id === card.id ? { ...c, isFlipped: true } : c
        );
        setCards(newCards);

        const newSelected = [...selectedCards, card];
        setSelectedCards(newSelected);

        if (newSelected.length === 2) {
            const [first, second] = newSelected;
            if (first.emoji === second.emoji) {
                setCards((currentCards) =>
                    currentCards.map((c) =>
                        c.emoji === first.emoji ? { ...c, isMatched: true } : c
                    )
                );
                setSelectedCards([]);
            } else {
                setTimeout(() => {
                    setCards((currentCards) =>
                        currentCards.map((c) =>
                            c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c
                        )
                    );
                    setSelectedCards([]);
                }, 1000);
            }
        }
    };

    return (
        <Container>
            <Header>
                <TimerText>⏱ {timer}초</TimerText>
                <GuideText>알람을 끄려면 같은 그림을 모두 찾으세요!</GuideText>
            </Header>

            <Grid>
                {cards.map((card) => (
                    <CardButton
                        key={card.id}
                        isFlipped={card.isFlipped}
                        isMatched={card.isMatched}
                        onPress={() => onCardPress(card)}
                        activeOpacity={0.8}
                        disabled={card.isFlipped || card.isMatched || selectedCards.length >= 2}
                    >
                        {(card.isFlipped || card.isMatched) && (
                            <CardText>{card.emoji}</CardText>
                        )}
                    </CardButton>
                ))}
            </Grid>
        </Container>
    );
}
