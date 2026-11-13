// 브라우저 안에서만 동작하는 SNS 활동 시뮬레이션. Node에서도 같은 엔진을 검사합니다.
(function (scope) {
    'use strict';
    const MINUTE = 60000, HOUR = 60 * MINUTE, DAY = 24 * HOUR;
    const LIMITS = Object.freeze({profiles: 40, recommendations: 10, requests: 10, offlineRequests: 2, likes: 12, comments: 3, reactionsPerTick: 6, postAge: 7 * DAY});
    const CONTENT = [
    {
        "text": "오늘은 평소보다 조금 일찍 일어나서 동네를 걸었다. 아침 공기가 좋네.",
        "comments": [
            "아침 산책은 공기가 달라서 좋지!",
            "나도 내일은 일찍 걸어봐야겠다.",
            "어느 코스로 다녀왔어?"
        ]
    },
    {
        "text": "밀린 과제 하나 끝! 잠깐 쉬었다가 다음 것도 시작해야겠다.",
        "comments": [
            "과제 끝낸 거 축하해!",
            "잠깐 쉬면서 간식도 챙겨 먹어.",
            "나도 밀린 과제 마무리해야겠다."
        ]
    },
    {
        "text": "오랜만에 책을 펼쳤는데 생각보다 시간이 빨리 갔다.",
        "comments": [
            "무슨 책 읽고 있어?",
            "책에 빠지면 시간 금방 가더라.",
            "좋았던 문장 있으면 나중에 알려줘."
        ]
    },
    {
        "text": "이어폰으로 듣기 좋은 노래를 찾는 중. 추천 있나요?",
        "comments": [
            "요즘은 잔잔한 재즈를 자주 들어.",
            "산책할 때 듣는 플레이리스트 공유해줄까?",
            "나는 어쿠스틱 노래 추천!"
        ]
    },
    {
        "text": "새로 생긴 카페에 다녀왔다. 다음에는 다른 메뉴도 먹어봐야지.",
        "comments": [
            "어떤 메뉴 먹었는지 궁금하다.",
            "새 카페 구경하는 재미가 있지.",
            "다음엔 같이 가보고 싶어."
        ]
    },
    {
        "text": "비 오는 날 창밖 보는 시간이 은근 좋다.",
        "comments": [
            "빗소리 들으면서 쉬면 좋더라.",
            "따뜻한 차 한 잔이랑 잘 어울리는 날이네.",
            "나도 창가에 앉아 있었어."
        ]
    },
    {
        "text": "사진 정리하다 작년 여행 사진을 발견했다. 또 가고 싶다.",
        "comments": [
            "사진 정리하면 여행 생각 많이 나지.",
            "어디 다녀온 사진이야?",
            "다음 여행 계획도 세워보자."
        ]
    },
    {
        "text": "오늘 저녁은 집밥. 간단하게 해 먹는 게 제일 편한 날도 있다.",
        "comments": [
            "집밥이 편한 날 공감해.",
            "오늘은 무슨 메뉴였어?",
            "나도 간단하게 해 먹었어."
        ]
    },
    {
        "text": "주말 계획은 아직 없지만 일단 늦잠은 확정.",
        "comments": [
            "늦잠도 중요한 주말 일정이지.",
            "푹 쉬는 주말 보내!",
            "나는 늦잠 자고 브런치 먹으려고."
        ]
    },
    {
        "text": "운동은 가기 전이 제일 어렵고 끝나면 항상 뿌듯하다.",
        "comments": [
            "끝나고 개운한 느낌 좋지!",
            "오늘도 운동 다녀왔구나.",
            "나도 일단 운동화부터 신어야겠다."
        ]
    },
    {
        "text": "걷다가 예쁜 꽃을 봤다. 계절이 바뀌는 게 느껴진다.",
        "comments": [
            "꽃 보면 계절 바뀌는 게 확 느껴져.",
            "산책길에 꽃이 많이 피었더라.",
            "무슨 꽃이었는지 궁금해."
        ]
    },
    {
        "text": "친구랑 별 얘기 없이 오래 통화했다. 이런 시간이 필요했나 보다.",
        "comments": [
            "별 얘기 안 해도 편한 친구가 좋지.",
            "오래 통화하면 마음이 가벼워질 때가 있어.",
            "나도 친구한테 연락해봐야겠다."
        ]
    },
    {
        "text": "새로운 취미를 하나 시작해볼까 고민 중이다.",
        "comments": [
            "어떤 취미 생각하고 있어?",
            "도예나 드로잉도 재밌더라.",
            "부담 없이 체험 수업부터 해봐!"
        ]
    },
    {
        "text": "코드가 드디어 돌아간다! 사소한 오타를 한참 찾았다.",
        "comments": [
            "오타 하나가 진짜 오래 걸릴 때 있지.",
            "드디어 실행됐다니 축하해!",
            "해결하고 나면 엄청 시원하지."
        ]
    },
    {
        "text": "점심 메뉴 고르는 게 하루 중 가장 어려운 결정일지도.",
        "comments": [
            "메뉴 고민하다 점심시간 다 가겠어.",
            "오늘은 국수 어때?",
            "나는 결국 늘 먹던 메뉴 골랐어."
        ]
    },
    {
        "text": "오늘 하늘 색이 예뻐서 잠깐 멈춰서 봤다.",
        "comments": [
            "나도 오늘 하늘 보고 잠깐 멈췄어.",
            "구름까지 예쁜 날이었지.",
            "가끔 위를 올려다보는 여유가 필요해."
        ]
    },
    {
        "text": "일정을 너무 꽉 채우지 않기로 했다. 쉬는 시간도 일정에 넣기.",
        "comments": [
            "쉬는 시간도 일정이라는 말 좋다.",
            "빈 시간이 있어야 숨 돌릴 수 있지.",
            "나도 약속 사이에 여유 좀 두려고."
        ]
    },
    {
        "text": "오랜만에 방 정리. 책상만 깔끔해져도 기분이 달라진다.",
        "comments": [
            "깔끔한 책상 보면 기분 좋아지지.",
            "방 정리 시작하기가 제일 어려워.",
            "나도 오늘 책상부터 치워야겠다."
        ]
    },
    {
        "text": "영화 한 편 보고 왔다. 여운이 남아서 음악을 다시 듣는 중.",
        "comments": [
            "어떤 영화 봤어?",
            "영화 끝나고 음악 다시 듣는 거 공감해.",
            "좋았던 장면도 궁금하다."
        ]
    },
    {
        "text": "이번 주도 수고 많았다. 다음 주에는 조금 덜 바쁘면 좋겠다.",
        "comments": [
            "이번 주도 고생 많았어.",
            "주말에는 푹 쉬자!",
            "다음 주는 조금 여유롭길."
        ]
    },
    {
        "text": "처음으로 직접 구운 쿠키. 모양은 제각각인데 맛은 괜찮다!",
        "comments": [
            "직접 구운 쿠키라 더 맛있겠다.",
            "모양이 다 달라서 더 귀여울 것 같아.",
            "다음에는 어떤 쿠키 만들 거야?",
            "오븐 앞에서 기다리는 시간이 설레지."
        ]
    },
    {
        "text": "버스 놓친 김에 한 정거장 걸었다. 생각보다 괜찮은 길을 발견했다.",
        "comments": [
            "우연히 좋은 길 찾았네.",
            "가끔 돌아가는 길도 재밌지."
        ]
    },
    {
        "text": "도서관 창가 자리를 잡았다. 오늘은 집중이 잘될 것 같은 예감.",
        "comments": [
            "창가 자리 좋지!",
            "오늘 공부 계획 잘 마치길.",
            "도서관 분위기면 집중 잘되더라."
        ]
    },
    {
        "text": "새 운동화를 신고 첫 러닝. 기록보다 꾸준히 뛰는 게 목표다.",
        "comments": [
            "첫 러닝 응원해!",
            "새 신발 적응하면서 천천히 뛰어.",
            "꾸준함이 제일 어렵고 멋진 목표지.",
            "다치지 말고 즐겁게 달리자.",
            "어떤 코스로 뛰었어?"
        ]
    },
    {
        "text": "옛날에 좋아하던 노래를 들었더니 그때 기억까지 같이 떠올랐다.",
        "comments": [
            "노래가 기억을 데려오는 거 신기해.",
            "어떤 노래인지 궁금하다.",
            "나도 옛 플레이리스트 다시 들어봐야겠다."
        ]
    },
    {
        "text": "노을 보려고 조금 일찍 나왔다. 기다린 보람이 있는 저녁이었다.",
        "comments": [
            "노을 기다리는 시간도 좋았겠다.",
            "오늘 저녁 하늘 정말 예뻤지."
        ]
    },
    {
        "text": "작은 화분을 하나 들였다. 이번에는 물 주는 날짜를 잘 기록해봐야지.",
        "comments": [
            "어떤 식물 데려왔어?",
            "물 주기 알림 해두면 편하더라.",
            "새 화분이랑 오래 함께하길!"
        ]
    },
    {
        "text": "오랜만에 자전거를 탔다. 바람 맞으면서 달리니 머리가 맑아진다.",
        "comments": [
            "자전거 타기 좋은 날이네.",
            "헬멧 챙기고 안전하게 타!",
            "어느 길로 다녀왔어?",
            "바람 맞는 기분 정말 좋지."
        ]
    },
    {
        "text": "동네 빵집에서 따뜻한 식빵을 샀다. 집까지 오는 길이 유난히 길었다.",
        "comments": [
            "갓 나온 식빵 냄새는 못 참지.",
            "따뜻할 때 한 조각 먹으면 최고야."
        ]
    },
    {
        "text": "시간을 정해두고 휴대폰 없이 쉬어봤다. 처음엔 어색했는데 꽤 괜찮았다.",
        "comments": [
            "나도 한번 해보고 싶다.",
            "처음에는 자꾸 폰 찾게 되더라.",
            "아무것도 안 하는 시간도 필요하지."
        ]
    },
    {
        "text": "친구랑 보드게임 한 판 하려다 세 판이나 했다. 다음엔 다른 게임도 해봐야지.",
        "comments": [
            "무슨 게임 했어?",
            "재밌으면 한 판으로 안 끝나지.",
            "다음엔 나도 끼워줘!",
            "보드게임 시간 정말 빨리 가더라."
        ]
    },
    {
        "text": "처음 가본 전시에서 마음에 드는 그림을 발견했다. 한참 앞에 서 있었다.",
        "comments": [
            "어떤 그림이었는지 궁금해.",
            "마음에 남는 작품을 만났구나.",
            "나도 전시 보러 가고 싶다."
        ]
    },
    {
        "text": "오늘은 레시피를 보지 않고 볶음밥을 만들었다. 냉장고 정리도 같이 끝!",
        "comments": [
            "볶음밥은 냉장고 정리에 딱이지.",
            "어떤 재료 넣었어?"
        ]
    },
    {
        "text": "비어 있던 노트 첫 장을 채웠다. 거창한 계획보다 오늘 한 일부터 적어보기.",
        "comments": [
            "첫 장 채운 거 멋지다.",
            "작은 기록이 쌓이면 뿌듯하더라.",
            "부담 없이 적는 게 오래가는 것 같아."
        ]
    },
    {
        "text": "주말에 바다 다녀온 기억으로 이번 주를 버티는 중. 파도 소리가 아직 생각난다.",
        "comments": [
            "바다는 다녀와도 또 가고 싶지.",
            "파도 소리만 들어도 편안해져.",
            "어느 바다 다녀왔어?",
            "다음 주말 나들이도 기대해보자."
        ]
    },
    {
        "text": "방 안 조명을 조금 바꿨더니 분위기가 달라졌다. 저녁 시간이 더 편안해졌다.",
        "comments": [
            "조명 하나로 분위기 많이 바뀌지.",
            "따뜻한 색 조명으로 바꿨어?"
        ]
    },
    {
        "text": "마감 전에 제출 버튼 누르고 나니 마음이 가볍다. 오늘은 일찍 자야겠다.",
        "comments": [
            "제출 끝내서 다행이다!",
            "수고했어, 푹 자.",
            "마지막 제출 버튼 누를 때 안심되지."
        ]
    },
    {
        "text": "길에서 만난 고양이가 잠깐 옆에 앉아 있었다. 괜히 기분 좋아진 하루.",
        "comments": [
            "고양이가 먼저 와줬구나.",
            "조용히 옆에 있어주면 기분 좋지.",
            "귀여운 만남이었겠다."
        ]
    },
    {
        "text": "새로 배운 기타 코드를 연습했다. 손끝은 아프지만 어제보다 소리가 낫다.",
        "comments": [
            "조금씩 소리 좋아지면 신나지.",
            "손 아프면 쉬어가면서 연습해.",
            "어떤 곡 연습하고 있어?",
            "꾸준히 연습하는 거 응원해!"
        ]
    },
    {
        "text": "새벽에 깨서 다시 자려다가 일출을 봤다. 예상하지 못한 선물 같은 시간.",
        "comments": [
            "일출까지 보다니 특별한 아침이네.",
            "다시 낮에 잠깐 쉬어도 좋겠다."
        ]
    },
    {
        "text": "산책 코스를 반대로 돌아봤다. 같은 길인데 처음 보는 가게가 보인다.",
        "comments": [
            "방향만 바꿔도 새롭더라.",
            "새로 발견한 가게는 어떤 곳이야?",
            "나도 내일 반대로 걸어봐야지."
        ]
    },
    {
        "text": "오늘 장을 볼 때 필요한 것만 적어 갔다. 간식 코너에서 조금 흔들리긴 했다.",
        "comments": [
            "간식 코너는 늘 어려운 구간이지.",
            "장보기 목록 적으면 확실히 도움이 돼.",
            "그래도 필요한 것 위주로 샀다니 성공!"
        ]
    },
    {
        "text": "따뜻한 차를 우려놓고 음악을 틀었다. 바쁘게 보낸 하루를 정리하는 중.",
        "comments": [
            "차 한 잔 마시며 쉬는 시간 좋지.",
            "오늘도 수고 많았어."
        ]
    },
    {
        "text": "예전에 찍은 사진 몇 장을 인화했다. 화면으로 볼 때와는 또 다른 느낌이다.",
        "comments": [
            "인화해서 보면 더 오래 보게 되더라.",
            "어디에 놓아둘 예정이야?",
            "추억이 손에 잡히는 느낌이지.",
            "나도 여행 사진 인화해야겠다."
        ]
    },
    {
        "text": "동네 시장에서 제철 과일을 샀다. 한 봉지 들고 오는 길이 뿌듯했다.",
        "comments": [
            "제철 과일이 제일 맛있지.",
            "어떤 과일 사 왔어?",
            "시장 구경하는 재미도 있었겠다."
        ]
    },
    {
        "text": "짧은 여행 가방을 미리 싸뒀다. 떠나기 전날의 설렘이 제일 큰 것 같다.",
        "comments": [
            "즐거운 여행 다녀와!",
            "짐 챙길 때부터 여행 시작이지.",
            "충전기 잊지 말고 챙겨.",
            "어디로 떠나는지 궁금해.",
            "좋은 추억 많이 만들고 와."
        ]
    },
    {
        "text": "몇 번이나 틀렸던 문제를 혼자 풀었다. 답보다 풀이가 이해돼서 더 기쁘다.",
        "comments": [
            "이해하고 풀었을 때 기분 좋지.",
            "포기 안 하고 풀어냈네!",
            "오늘 배운 건 오래 기억날 것 같아."
        ]
    },
    {
        "text": "오랜만에 집에서 영화 볼 준비 완료. 간식까지 챙기니 작은 영화관 같다.",
        "comments": [
            "오늘 상영작은 뭐야?",
            "간식 준비까지 완벽하네."
        ]
    },
    {
        "text": "세탁한 이불을 덮으니 하루가 잘 마무리되는 기분이다. 오늘은 숙면 예약.",
        "comments": [
            "뽀송한 이불은 최고의 마무리지.",
            "편안하게 푹 자!",
            "갓 세탁한 이불 냄새 좋아."
        ]
    },
    {
        "text": "이번 달에 찍은 사진으로 작은 앨범을 만들었다. 평범한 날도 모아보니 소중하다.",
        "comments": [
            "평범한 일상이 모이면 좋은 기록이 되지.",
            "작은 앨범 만드는 아이디어 좋다.",
            "나중에 다시 펼쳐보면 더 소중하겠다.",
            "나도 이번 달 사진 정리해봐야겠어."
        ]
    }
];
    const TEXTS = CONTENT.map(item => item.text);
    const AVATARS = Object.freeze({
        default: ['img/default-avatar.svg'],
        face: Array.from({length:8}, (_,i)=>`img/profiles/face-${String(i+1).padStart(2,'0')}.svg`),
        landscape: ['lake','mountain','ocean','sunrise','sunset','extra-02','extra-03','extra-04','extra-05','extra-06','extra-15'].map(name=>`img/profiles/${name}.webp`),
        flower: ['poppies','bouquet','extra-07','extra-09','extra-10'].map(name=>`img/profiles/${name}.webp`),
        animal: ['cat','dog','extra-11','extra-12','extra-13'].map(name=>`img/profiles/${name}.webp`),
        object: ['coffee','books','gardening','extra-01','extra-08','extra-14'].map(name=>`img/profiles/${name}.webp`)
    });
    const TEMPLATE_PAIRS = [
    {
        "id": "template:0",
        "negative": "아침에 잠깐 걷는 걸 대단한 일처럼 쓰네.",
        "defense": "아침 산책이 좋았다는 이야기잖아. 대단함을 겨루는 글은 아니지."
    },
    {
        "id": "template:1",
        "negative": "과제 하나 끝낸 걸 굳이 알릴 필요가 있나.",
        "defense": "밀린 과제를 끝내서 기쁜 마음을 나눈 거지. 작은 성취도 존중해주자."
    },
    {
        "id": "template:2",
        "negative": "책 조금 읽었다고 시간을 잘 쓴 건 아니지.",
        "defense": "책에 집중해서 즐거웠다는 얘기잖아. 시간을 평가할 필요는 없을 것 같아."
    },
    {
        "id": "template:3",
        "negative": "노래도 남한테 추천받아야 하나.",
        "defense": "새로운 음악을 함께 찾아보자는 거지. 추천을 묻는 게 이상한 건 아니잖아."
    },
    {
        "id": "template:4",
        "negative": "새 카페라고 다 가보는 것도 뻔하네.",
        "defense": "새로운 메뉴가 궁금해서 다녀온 거잖아. 각자 쉬는 방식은 다를 수 있어."
    },
    {
        "id": "template:5",
        "negative": "비 오는 창밖이 그렇게 특별한가.",
        "defense": "빗소리를 들으며 쉬는 시간이 좋을 수도 있지. 취향을 깎아내리진 말자."
    },
    {
        "id": "template:6",
        "negative": "옛 여행 사진으로 계속 추억 얘기하네.",
        "defense": "사진을 정리하다 좋은 기억이 떠오를 수 있지. 추억을 나눌 수도 있잖아."
    },
    {
        "id": "template:7",
        "negative": "간단한 집밥 얘기까지 올려야 하나.",
        "defense": "편하게 해 먹은 저녁을 기록한 거잖아. 평범한 일상도 나눌 수 있지."
    },
    {
        "id": "template:8",
        "negative": "주말을 늦잠으로 보내는 건 아깝지 않나.",
        "defense": "쉬는 것도 주말을 보내는 방법이지. 모두의 휴식이 같을 필요는 없어."
    },
    {
        "id": "template:9",
        "negative": "운동 끝나고 뿌듯하다는 얘기는 흔하네.",
        "defense": "가기 어려워도 다녀온 걸 격려해줄 수 있지. 흔한 경험이어도 의미는 있어."
    },
    {
        "id": "template:10",
        "negative": "길가의 꽃 하나가 그렇게 감동적인가.",
        "defense": "꽃에서 계절 변화를 느낄 수 있지. 작은 즐거움을 굳이 평가하진 말자."
    },
    {
        "id": "template:11",
        "negative": "별 얘기도 없이 오래 통화하는 건 시간 낭비 같은데.",
        "defense": "편한 친구와 이야기하는 시간 자체가 위로가 될 수 있어."
    },
    {
        "id": "template:12",
        "negative": "취미도 스스로 못 정하고 고민만 하네.",
        "defense": "새로운 걸 시작하기 전에 고민할 수 있지. 부담 주기보다 경험을 나눠주자."
    },
    {
        "id": "template:13",
        "negative": "오타 하나 찾은 걸로 그렇게 기뻐할 일인가.",
        "defense": "오래 막혔던 코드가 돌아가면 기쁠 수 있지. 해결한 노력을 봐주자."
    },
    {
        "id": "template:14",
        "negative": "점심 메뉴로 고민하는 것도 한가해 보이네.",
        "defense": "가볍게 꺼낸 점심 이야기잖아. 한가한지까지 판단할 필요는 없지."
    },
    {
        "id": "template:15",
        "negative": "하늘 예쁘다는 글은 너무 자주 보인다.",
        "defense": "예쁜 하늘을 보고 잠깐 즐거웠던 거잖아. 비슷한 경험도 나눌 수 있어."
    },
    {
        "id": "template:16",
        "negative": "일정에 쉬는 시간까지 넣는 건 유난 같은데.",
        "defense": "휴식 시간을 챙기려는 거지. 자기 페이스를 정하는 걸 존중해주자."
    },
    {
        "id": "template:17",
        "negative": "방 정리가 무슨 성과라고 올리는지 모르겠네.",
        "defense": "책상을 치우고 기분이 좋아졌다는 얘기잖아. 큰 성과만 올려야 하는 건 아니지."
    },
    {
        "id": "template:18",
        "negative": "영화 음악까지 다시 듣는 건 좀 과한 것 같아.",
        "defense": "좋았던 영화의 여운을 음악으로 즐길 수 있지. 취향 차이로 보면 될 것 같아."
    },
    {
        "id": "template:19",
        "negative": "매주 수고했다는 얘기도 똑같네.",
        "defense": "한 주를 마무리하며 서로 격려할 수 있지. 반복되는 일상에도 응원은 필요해."
    },
    {
        "id": "template:20",
        "negative": "쿠키 모양이 저 정도면 굳이 올릴 필요는 없었을 듯.",
        "defense": "처음 구운 쿠키라잖아. 모양보다는 직접 도전한 걸 봐주면 좋겠어."
    },
    {
        "id": "template:21",
        "negative": "버스를 놓친 걸 괜히 좋게 포장하는 것 같네.",
        "defense": "놓친 김에 걸으며 좋은 길을 찾을 수도 있지. 긍정적으로 본 게 문제는 아니잖아."
    },
    {
        "id": "template:22",
        "negative": "도서관 자리만 잡는다고 집중이 되나.",
        "defense": "집중해보려는 마음을 적은 거잖아. 아직 해보기도 전에 단정하진 말자."
    },
    {
        "id": "template:23",
        "negative": "새 운동화가 생겼다고 러닝이 꾸준해지진 않을 텐데.",
        "defense": "기록보다 꾸준함이 목표라잖아. 첫 러닝부터 의욕을 꺾을 필요는 없지."
    },
    {
        "id": "template:24",
        "negative": "옛날 노래만 들으며 추억에 머무르는 느낌이네.",
        "defense": "노래에 얽힌 기억을 떠올릴 수 있지. 그걸 멈춰 있다는 뜻으로 볼 필요는 없어."
    },
    {
        "id": "template:25",
        "negative": "노을 하나 보려고 기다리는 건 시간이 아깝다.",
        "defense": "노을을 기다리는 시간이 즐거웠을 수 있지. 시간 쓰는 취향은 서로 다르잖아."
    },
    {
        "id": "template:26",
        "negative": "화분은 사놓고 또 물 주는 걸 잊는 거 아닌가.",
        "defense": "이번에는 날짜를 기록해보려는 거잖아. 시작부터 실패를 단정하진 말자."
    },
    {
        "id": "template:27",
        "negative": "자전거 좀 탔다고 머리까지 맑아지나.",
        "defense": "바람을 맞으며 기분 전환이 됐다는 뜻이지. 느낀 기분을 부정할 필요는 없어."
    },
    {
        "id": "template:28",
        "negative": "식빵 하나 샀다고 이렇게 길게 쓸 일인가.",
        "defense": "따뜻한 빵을 기다리는 소소한 즐거움을 적은 거잖아. 가볍게 읽어주면 되지."
    },
    {
        "id": "template:29",
        "negative": "휴대폰 없이 잠깐 쉰 것도 자랑거리가 되네.",
        "defense": "새로운 휴식 방법을 시도해봤다는 이야기지. 자랑이라고 단정하진 말자."
    },
    {
        "id": "template:30",
        "negative": "보드게임을 세 판이나 하는 건 시간 낭비 아닌가.",
        "defense": "친구와 즐겁게 보낸 시간이잖아. 놀이 시간을 낭비라고 정할 필요는 없지."
    },
    {
        "id": "template:31",
        "negative": "그림 앞에 오래 선다고 감상이 깊어지는 건 아니지.",
        "defense": "마음에 드는 작품을 천천히 본 거잖아. 감상하는 속도는 다를 수 있어."
    },
    {
        "id": "template:32",
        "negative": "냉장고 정리한 볶음밥이 대단한 요리도 아니잖아.",
        "defense": "대단한 요리라고 한 게 아니라 간단히 해 먹은 일상을 나눈 거지."
    },
    {
        "id": "template:33",
        "negative": "노트 첫 장 채웠다고 기록 습관이 생기나.",
        "defense": "오늘 한 일부터 적으며 시작하려는 거잖아. 첫걸음도 응원해줄 수 있지."
    },
    {
        "id": "template:34",
        "negative": "바다 한번 다녀온 걸로 한 주를 버틴다는 건 과장 같네.",
        "defense": "좋았던 기억이 평일에 힘이 될 수도 있지. 표현을 너무 날카롭게 볼 필요는 없어."
    },
    {
        "id": "template:35",
        "negative": "조명 바꾼다고 방이 얼마나 달라지겠어.",
        "defense": "저녁이 더 편안해졌다고 느낄 수 있지. 공간에서 느끼는 변화는 사람마다 달라."
    },
    {
        "id": "template:36",
        "negative": "마감 전에 제출한 건 당연한 일 아닌가.",
        "defense": "제출하고 안도한 마음을 나눈 거잖아. 당연한 일이어도 수고했다고 할 수 있어."
    },
    {
        "id": "template:37",
        "negative": "고양이가 옆에 앉은 것까지 의미를 붙이네.",
        "defense": "짧은 만남에 기분이 좋아질 수도 있지. 큰 의미를 강요한 글도 아니잖아."
    },
    {
        "id": "template:38",
        "negative": "기타 코드 하나로 좋아졌다는 건 너무 이른 판단 아닌가.",
        "defense": "어제보다 소리가 나아졌다는 이야기잖아. 작은 변화를 느끼며 연습할 수 있지."
    },
    {
        "id": "template:39",
        "negative": "새벽에 깬 걸 선물 같은 시간이라고 하는 건 과장 같아.",
        "defense": "우연히 본 일출이 좋았던 거지. 본인이 느낀 즐거움을 존중해주자."
    },
    {
        "id": "template:40",
        "negative": "같은 산책길 방향만 바꾼 게 그렇게 새로운가.",
        "defense": "방향을 바꾸니 못 보던 가게가 보였다는 거잖아. 사소한 발견도 재밌을 수 있어."
    },
    {
        "id": "template:41",
        "negative": "장보기 목록 지키는 것도 어려운 일은 아니잖아.",
        "defense": "목록을 적고 필요한 걸 사려던 경험을 나눈 거지. 어렵다는 경쟁을 할 필요는 없지."
    },
    {
        "id": "template:42",
        "negative": "차 마시고 음악 듣는 걸 특별한 마무리처럼 쓰네.",
        "defense": "하루를 편안하게 정리하는 방식일 뿐이잖아. 각자의 휴식은 존중해주자."
    },
    {
        "id": "template:43",
        "negative": "요즘 사진을 굳이 인화하는 건 번거롭기만 하던데.",
        "defense": "화면과 다른 느낌이 좋아서 인화한 거잖아. 기록을 즐기는 방식은 다를 수 있어."
    },
    {
        "id": "template:44",
        "negative": "과일 한 봉지로 뿌듯해하는 건 좀 유난 같아.",
        "defense": "시장에서 제철 과일을 고른 작은 즐거움일 수 있지. 유난이라고 할 필요는 없어."
    },
    {
        "id": "template:45",
        "negative": "가방부터 싸놓고 여행을 너무 들뜨게 기다리네.",
        "defense": "떠나기 전 설렘도 여행의 일부잖아. 기대하는 마음을 굳이 꺾진 말자."
    },
    {
        "id": "template:46",
        "negative": "같은 문제를 몇 번이나 틀린 거면 기초부터 봐야겠네.",
        "defense": "풀이를 이해해서 혼자 풀어냈다잖아. 지나간 실수보다 배운 점을 봐주자."
    },
    {
        "id": "template:47",
        "negative": "집에서 영화 보는 걸 영화관에 비유하는 건 좀 과하지.",
        "defense": "간식 챙기며 즐겁게 볼 준비를 했다는 뜻이지. 가벼운 비유로 읽으면 되잖아."
    },
    {
        "id": "template:48",
        "negative": "이불 세탁한 걸로 숙면까지 보장되나.",
        "defense": "뽀송한 이불이 기분 좋다는 말이지. 숙면을 증명하라는 얘기는 아니잖아."
    },
    {
        "id": "template:49",
        "negative": "평범한 사진들 모아 앨범까지 만들 필요가 있나.",
        "defense": "평범한 날도 본인에게는 소중하잖아. 일상을 기록하는 방식을 존중해주자."
    }
];
    const OWN_PAIRS = [
        {id:'topic:running', patterns:[/러닝|달리기|조깅/,/완주|뛰었|다녀왔|기록|완료/],negative:'러닝 기록을 매번 올릴 필요가 있을까.',defense:'달린 기록을 남기는 게 동기부여가 될 수 있지. 각자의 기록 방식은 존중하자.'},
        {id:'topic:cooking', patterns:[/쿠키|볶음밥|파스타|요리/,/만들었|구웠|직접 만든|완성했/],negative:'직접 만든 요리를 굳이 자랑할 정도인가.',defense:'직접 만들어서 기쁜 마음을 나눈 거지. 요리 실력을 겨루는 글은 아니잖아.'},
        {id:'topic:travel', patterns:[/여행|바다/,/다녀왔|갔다 왔|다녀온/],negative:'다녀온 여행 이야기도 다 비슷하게 느껴지네.',defense:'비슷한 장소라도 각자 다른 추억이 생길 수 있지. 여행 이야기를 나눌 수는 있잖아.'},
        {id:'topic:study', patterns:[/과제|시험|공부/,/끝냈|마쳤|완료했|제출했/],negative:'공부나 과제를 끝낸 건 당연한 일 같은데.',defense:'끝내고 안도한 마음을 나누는 거잖아. 수고한 걸 인정해줄 수는 있지.'},
        {id:'topic:reading', patterns:[/책|소설/,/다 읽었|완독했|읽고 나니/],negative:'책 한 권 읽었다고 특별한 일은 아니지.',defense:'읽고 남은 느낌을 기록할 수 있잖아. 독서량을 비교할 필요는 없을 것 같아.'},
        {id:'topic:film', patterns:[/영화/,/보고 왔|봤는데|보고 나니|감상했/],negative:'영화 보고 난 감상도 다 비슷한 것 같네.',defense:'같은 영화라도 느낀 점은 다를 수 있지. 자기 감상을 나누는 건 괜찮잖아.'},
        {id:'topic:tidying', patterns:[/방 정리|책상 정리|방을 정리|책상을 정리/,/끝냈|마쳤|했더니|완료/],negative:'정리한 걸 굳이 성과처럼 쓸 필요가 있나.',defense:'공간을 정리하고 기분이 좋아졌을 수 있지. 작은 변화도 나눌 수 있어.'},
        {id:'topic:code', patterns:[/코드|프로그램|버그/,/해결했|고쳤|돌아간다|실행됐/],negative:'코드 고친 일까지 그렇게 기뻐할 만한가.',defense:'막혔던 문제를 해결하면 기쁠 수 있지. 해결한 노력을 가볍게 보진 말자.'}
    ];
    const POSITIVE_COMMENTS = {
    "general": [
        "글 잘 읽고 가요.",
        "이야기 나눠줘서 고마워.",
        "소식 남겨줘서 반가워.",
        "오늘의 기록도 잘 봤어.",
        "가끔 이렇게 근황 알려줘.",
        "편하게 이야기 나눌 수 있어서 좋네.",
        "네 이야기에 잠깐 귀 기울이고 가.",
        "다음 이야기도 기다릴게.",
        "시간 내서 읽고 있어.",
        "일상을 나눠줘서 고마워.",
        "네 페이스대로 지내길 바라.",
        "여기서 소식 들을 수 있어 좋다.",
        "오늘도 응원하고 갈게.",
        "생각을 적어줘서 고마워.",
        "짧은 글이어도 잘 읽었어.",
        "이렇게 기록이 하나씩 쌓이는구나.",
        "잠깐 들러서 이야기 읽고 가요.",
        "편안한 하루가 되길 바라.",
        "앞으로도 종종 소식 전해줘.",
        "읽으면서 잠시 생각해봤어.",
        "나눠준 이야기를 기억해둘게.",
        "네 일상이 궁금했는데 반가워.",
        "자신에게 맞는 속도로 이어가면 좋겠다.",
        "글 남겨줘서 고마워요."
    ],
    "media": [
        "첨부한 내용도 함께 잘 봤어.",
        "이야기랑 첨부를 같이 볼 수 있어 좋네.",
        "파일까지 함께 남겨줘서 고마워.",
        "첨부도 넘겨보며 확인했어.",
        "기록을 이렇게 함께 나눌 수 있구나.",
        "첨부한 자료도 보고 가요.",
        "글과 함께 올린 내용도 잘 확인했어.",
        "다음 기록도 이렇게 나눠줘."
    ],
    "running": [
        "달리기 기록을 이어가는 거 응원해.",
        "뛰고 나서는 편하게 쉬어줘.",
        "다치지 않고 꾸준히 달리길 바라."
    ],
    "cooking": [
        "직접 만든 음식이라 더 의미 있겠다.",
        "요리하고 정리하느라 수고했어.",
        "만드는 과정도 나중에 들려줘."
    ],
    "travel": [
        "다녀온 곳의 이야기가 궁금하다.",
        "여행 기억이 오래 좋은 힘이 되면 좋겠어.",
        "다음 여행 이야기도 들려줘."
    ],
    "study": [
        "끝내고 나니 마음이 한결 가볍겠다.",
        "공부 마무리하느라 수고 많았어.",
        "잠깐 쉬면서 뿌듯함도 챙겨."
    ],
    "reading": [
        "완독하고 남은 생각도 궁금해.",
        "책을 끝까지 읽은 거 응원해.",
        "마음에 남은 부분도 나중에 알려줘."
    ],
    "film": [
        "영화 보고 남은 감상이 궁금하다.",
        "기억에 남는 장면도 들려줘.",
        "다음에 볼 영화도 정했어?"
    ],
    "tidying": [
        "정리하고 나면 공간이 한결 편해지지.",
        "정돈한 공간에서 편히 쉬길 바라.",
        "정리 마무리하느라 수고했어."
    ],
    "code": [
        "막힌 부분을 해결했다니 축하해.",
        "코드가 돌아가는 순간 정말 시원하지.",
        "어떻게 해결했는지도 나중에 들려줘."
    ]
};
    const OWN_EXTRA_PAIRS = {
    "running": [
        [
            "달리기 기록도 다 비슷해서 새로울 게 없네.",
            "기록이 비슷해 보여도 달린 사람에게는 매번 의미가 있지. 꾸준함을 존중해주자."
        ],
        [
            "러닝한 걸 굳이 소식으로 남겨야 하나.",
            "달린 날을 기록하며 동기부여를 받을 수 있잖아. 소식을 나누는 방식은 다를 수 있어."
        ]
    ],
    "cooking": [
        [
            "요리 한 번 했다고 이렇게 알릴 일인가.",
            "직접 만들고 나눈 즐거움을 적은 거잖아. 요리를 평가하자는 글은 아니지."
        ],
        [
            "직접 만든 음식이라는 얘기도 흔한 것 같네.",
            "흔한 경험이어도 만든 사람에게는 보람이 있지. 작은 즐거움도 나눌 수 있어."
        ]
    ],
    "travel": [
        [
            "여행 다녀왔다는 얘기는 매번 비슷하네.",
            "같은 여행지라도 각자의 추억은 다르지. 다녀온 이야기를 나눌 수는 있잖아."
        ],
        [
            "다녀온 곳 얘기를 굳이 이렇게 남겨야 하나.",
            "여행을 기록하고 싶을 수도 있지. 필요한 기록인지 대신 정할 필요는 없잖아."
        ]
    ],
    "study": [
        [
            "공부 끝냈다는 것까지 소식으로 올리네.",
            "끝내고 마음이 가벼워진 걸 나눌 수 있지. 다른 사람의 수고를 작게 보진 말자."
        ],
        [
            "과제나 공부를 마친 건 누구나 하는 일인데.",
            "누구나 할 수 있는 일이어도 끝내기까지 노력은 들어가지. 서로 격려해주면 좋겠어."
        ]
    ],
    "reading": [
        [
            "완독했다는 말만으로는 별 내용이 없네.",
            "다 읽었다는 기록부터 남길 수도 있지. 감상을 길게 써야만 하는 건 아니잖아."
        ],
        [
            "책 한 권 끝낸 걸 굳이 알릴 필요가 있나.",
            "독서를 이어가는 동기가 될 수도 있잖아. 자기 기록을 남기는 건 괜찮지."
        ]
    ],
    "film": [
        [
            "영화 봤다는 얘기가 뭐 그렇게 새롭겠어.",
            "새로운 정보만 올려야 하는 건 아니잖아. 보고 느낀 걸 나눌 수 있지."
        ],
        [
            "영화 감상 하나까지 올리는 건 유난 같네.",
            "개인의 감상을 적는 공간이잖아. 유난이라고 단정할 필요는 없을 것 같아."
        ]
    ],
    "tidying": [
        [
            "정리 끝냈다는 말도 굳이 올려야 하나.",
            "정리하고 기분이 좋아진 걸 기록할 수 있지. 사소한 변화도 공유할 수 있어."
        ],
        [
            "공간 좀 정리한 걸 크게 말하는 느낌이네.",
            "정리에 들인 수고는 본인이 잘 알잖아. 다른 사람의 보람을 작게 보지는 말자."
        ]
    ],
    "code": [
        [
            "코드 한 번 고친 걸 소식으로 남기네.",
            "문제를 해결한 기록을 남기면 도움이 되지. 해결한 기쁨도 나눌 수 있어."
        ],
        [
            "프로그램 돌아간다는 얘기도 늘 비슷하네.",
            "겉으로 비슷해 보여도 해결한 문제는 다를 수 있지. 노력까지 똑같다고 보진 말자."
        ]
    ]
};
    const OWN_GENERAL_PAIRS = [
    {
        "id": "own:general",
        "negative": "굳이 이런 얘기까지 올릴 필요가 있나 싶네.",
        "defense": "자기 일상을 기록할 수 있는 공간이잖아. 올릴 필요가 없다고 단정하진 말자."
    },
    {
        "id": "own:general:2",
        "negative": "이 정도 이야기는 그냥 넘겨도 될 것 같은데.",
        "defense": "크고 특별한 일만 나눠야 하는 건 아니잖아. 각자의 기록을 존중해주자."
    },
    {
        "id": "own:general:3",
        "negative": "생각보다 특별한 얘기는 아니네.",
        "defense": "특별한 이야기인지 평가받으려고 올린 건 아닐 수 있지. 편하게 나눌 수는 있잖아."
    },
    {
        "id": "own:general:4",
        "negative": "이런 근황까지 다 알릴 필요는 없어 보인다.",
        "defense": "근황을 얼마나 나눌지는 본인이 정할 수 있지. 보고 싶지 않으면 지나가면 되잖아."
    },
    {
        "id": "own:general:5",
        "negative": "개인적인 기록은 혼자 남겨도 되는 것 아닌가.",
        "defense": "함께 나누고 싶은 기록도 있잖아. 개인적인 이야기라는 이유로 밀어낼 필요는 없지."
    },
    {
        "id": "own:general:6",
        "negative": "내용이 좀 사소하게 느껴지는데.",
        "defense": "사소해 보여도 당사자에게는 의미가 있을 수 있어. 가볍게 존중해주면 좋겠어."
    }
];
    const OWN_COMMENT_PAIRS = [...OWN_PAIRS.flatMap(pair=>[pair,...OWN_EXTRA_PAIRS[pair.id.split(':')[1]].map(([negative,defense],i)=>({id:`${pair.id}:${i+2}`,negative,defense}))]),...OWN_GENERAL_PAIRS];
    const NEGATIVE_COMMENTS = [...TEMPLATE_PAIRS,...OWN_COMMENT_PAIRS].map(pair=>pair.negative);
    const DEFENSE_COMMENTS = [...TEMPLATE_PAIRS,...OWN_COMMENT_PAIRS].map(pair=>pair.defense);
    const SECONDARY_DEFENSES = [
    "같은 경험도 사람마다 의미가 다를 수 있지. 다른 사람의 기록을 깎아내리지는 말자.",
    "의견이 다르면 그냥 다르다고 말해도 되잖아. 상대를 낮출 필요는 없지.",
    "평범한 경험도 나눌 수 있는 곳이면 좋겠어. 조금만 부드럽게 이야기하자.",
    "다르게 느껴져도 기록할 마음은 존중해줬으면 해.",
    "내 기준과 다르다는 이유로 공유한 사람을 평가하지는 말자.",
    "일상을 올리는 데 특별한 자격이 필요한 건 아니잖아. 서로 편하게 이야기하자."
];
    function create({storage, now = Date.now, random = Math.random} = {}) {
        const read = (key, fallback) => { try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; } };
        const write = (key, value) => { try { storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
        const int = (min, max) => min + Math.floor(random() * (max - min + 1));
        const pick = values => values[int(0, values.length - 1)];
        const shuffle = values => { const copy = [...values]; for (let i = copy.length - 1; i > 0; i--) { const j = int(0, i); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
        let pool = [];
        function boot() {
            const old = read('fakebookDummyProfiles', []);
            pool = Array.isArray(old) ? old.map(p => ({...p})) : [];
            const names = new Set(pool.map(p => p.name));
            for (let i = 1; pool.length < LIMITS.profiles; i++) {
                if (pool.some(p => p.id === `demo-${i}`)) continue;
                const combinations = ['김','이','박','최','정','강','윤','한','송','임'].flatMap(a => ['서연','도윤','지우','민준','하린','시우','수빈','지호','예린','건우','유진','서준','하늘','은우','다온','채원'].map(b => a+b)).filter(n => !names.has(n));
                const name = combinations.length ? pick(combinations) : `친구 ${i}`; names.add(name);
                pool.push({id:`demo-${i}`, name, dummy:true, bio:pick(['사진과 산책을 좋아해요.','천천히 배우는 중','음악과 함께하는 일상 🎧','맛있는 음식과 여행 이야기','작은 일상을 기록합니다.']), birthday:`${int(1996,2007)}-${String(int(1,12)).padStart(2,'0')}-${String(int(1,28)).padStart(2,'0')}`});
            }
            const mix = [...Array(4).fill('default'),...Array(8).fill('face'),...Array(11).fill('landscape'),...Array(5).fill('flower'),...Array(5).fill('animal'),...Array(7).fill('object')];
            const kinds = shuffle(Array.from({length:pool.length}, (_,i)=>mix[i%mix.length]));
            const decks = Object.fromEntries(Object.entries(AVATARS).map(([kind,files])=>[kind,shuffle(files)]));
            const used = {};
            pool.forEach((person, index) => {
                if (!person.ambientCatalog) {
                    person.sampleIndices = shuffle(TEXTS.map((_,i)=>i)).slice(0,int(0,3));
                    person.ambientCatalog = 1;
                }
                if (person.sampleCatalogVersion !== 2) {
                    person.sampleIndices = shuffle(TEXTS.map((_,i)=>i)).slice(0,person.sampleIndices.length);
                    person.sampleCatalogVersion = 2;
                }
                if (person.avatarAssetVersion !== 2) {
                    const kind = kinds[index], deck = decks[kind];
                    const offset = used[kind] || 0; used[kind] = offset + 1;
                    person.avatarKind = kind; person.avatar = deck[offset % deck.length];
                    person.avatarAssetVersion = 2;
                }
            });
            if (!pool.some(person=>person.temperament === 'blunt')) {
                const selected = new Set(shuffle(pool.map(person=>person.id)).slice(0,3));
                pool.forEach(person=>{person.temperament = selected.has(person.id) ? 'blunt' : 'friendly';});
            }
            if (JSON.stringify(old) !== JSON.stringify(pool)) write('fakebookDummyProfiles',pool);
            seedPosts(); return pool;
        }
        function seedPosts() {
            const posts = read('fakebookPosts', []); if (!Array.isArray(posts)) return;
            const original = JSON.stringify(posts);
            const desired = new Map(); pool.forEach(person=>person.sampleIndices.forEach((text,index)=>desired.set(`demo-post:${person.id}:${index}`,{person,text,index})));
            const engaged = p => (p.likedBy?.length || p.savedBy?.length || p.comments?.length || p.legacyLikes || p.likes || p.media?.length);
            const next = posts.filter(p=> !p.demo || !String(p.id).startsWith('demo-post:') || desired.has(p.id) || engaged(p));
            next.forEach(p=> {
                if (p.demo && p.ambientSampleVersion !== 2 && !engaged(p) && pool.some(person=>person.id===p.authorId)) {
                    const match = desired.get(p.id); const index = match?.text ?? int(0,TEXTS.length-1);
                    p.text = TEXTS[index]; p.ambientSampleVersion = 2;
                }
            });
            const ids = new Set(next.map(p=>p.id));
            for (const [id,{person,text}] of desired) if (!ids.has(id)) next.push({id,authorId:person.id,author:person.name,text:TEXTS[text],demo:true,ambientSampleVersion:2,createdAt:new Date(now()-int(1,14*24)*HOUR).toISOString(),likedBy:[],savedBy:[],comments:[],media:[],legacyLikes:0});
            for (const post of next) {
                if (!post.demo || post.ambientEngagementVersion || !pool.some(p=>p.id===post.authorId)) continue;
                const index = TEXTS.indexOf(post.text);
                if (index < 0) continue; // 별도로 수정한 글에는 자동 댓글을 붙이지 않습니다.
                post.likedBy = [...new Set(post.likedBy || [])];
                const candidates = shuffle(pool.filter(p=>p.id!==post.authorId && !post.likedBy.includes(p.id)));
                post.likedBy.push(...candidates.slice(0,int(0,25)).map(p=>p.id));
                post.comments ||= [];
                const choices = shuffle(CONTENT[index].comments).slice(0,int(2,CONTENT[index].comments.length));
                const authors = shuffle(pool.filter(p=>p.id!==post.authorId));
                const created = Date.parse(post.createdAt);
                choices.forEach((text,i)=>post.comments.push(autoComment(post, read('fakebookCurrentUser',null)?.id, {id:`sample-comment:${post.id}:${i}`,authorId:authors[i].id,author:authors[i].name,text,likedBy:[],simulated:true,seeded:true,createdAt:new Date(Math.min(now(),(Number.isFinite(created)?created:now())+(i+1)*5*MINUTE)).toISOString()}, .05)));
                post.ambientEngagementVersion = 1;
            }
            const accountId = read('fakebookCurrentUser',null)?.id;
            if (accountId) for (const post of next) {
                if (!post.demo) continue;
                post.comments = (post.comments || []).map(comment=> {
                    if (!comment.seeded || comment.civilityReviewed || comment.negative) return comment;
                    if (comment.likedBy?.length || comment.replies?.length || comment.updatedAt) return {...comment,civilityReviewed:true};
                    return autoComment(post, accountId, comment, .05);
                });
            }
            repairConversations(next);
            decoratePosts(next);
            if (original !== JSON.stringify(next)) savePosts(next);
        }
        const normalizeContext = text => String(text || '').trim().replace(/\s+/g,' ');
        function conversationPair(post) {
            const text = normalizeContext(post.text);
            const index = TEXTS.findIndex(value=>normalizeContext(value)===text);
            if (index >= 0) return TEMPLATE_PAIRS[index];
            // 자유 입력은 단어 하나로 추정하지 않고, 부정·질문·어려움·복수 주제는 건너뜁니다.
            if (!text || /[?？“”"「」]|아니|않|못|취소|계획|싶|예정|실패|싫|힘들|괴롭|우울|아프|아파|부상|병원|사고|장례|사망|죽|말라고|하지 마|비꼬|악플/.test(text)) return null;
            const matches = OWN_PAIRS.filter(pair=>pair.patterns.every(pattern=>pattern.test(text)));
            return matches.length === 1 ? matches[0] : null;
        }
        function conversationOptions(post, fallback=false) {
            const pair=conversationPair(post);
            if (!pair) return fallback ? OWN_GENERAL_PAIRS : [];
            if (pair.id.startsWith('template:')) return [pair];
            return OWN_COMMENT_PAIRS.filter(option=>option.id===pair.id || option.id.startsWith(pair.id+':'));
        }
        function resolveCommentPair(post, comment) {
            return conversationOptions(post,true).find(pair=>pair.id===comment.negativePairId && pair.negative===comment.text) || null;
        }
        function positiveCandidates(post) {
            const pair=conversationPair(post), topic=pair?.id.startsWith('topic:') ? pair.id.split(':')[1] : null;
            return [...POSITIVE_COMMENTS.general,...(post.media?.length?POSITIVE_COMMENTS.media:[]),...(topic?POSITIVE_COMMENTS[topic]||[]:[])];
        }
        function stableHash(value) {
            let hash=2166136261;
            for (const char of String(value)) {hash^=char.codePointAt(0);hash=Math.imul(hash,16777619);}
            hash^=hash>>>16; hash=Math.imul(hash,0x85ebca6b); hash^=hash>>>13; hash=Math.imul(hash,0xc2b2ae35); hash^=hash>>>16;
            return hash>>>0;
        }
        function decorate(item, key, post, kind) {
            if (item.emojiVersion===1) return;
            item.emojiVersion=1; item.emoji='';
            if (/\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(item.text || '')) return;
            const hash=stableHash(key); if(hash%10>=3) return;
            let choices;
            if(item.negative) choices=['🤨','😒','🙄'];
            else if(item.defense) choices=['🤝','🙂','💬'];
            else {
                const text=(item.text || '')+' '+(post.text || '');
                if (/음식|요리|쿠키|빵|볶음밥|과일|메뉴|집밥/.test(text)) choices=['🍽️','😋','🙂'];
                else if (/여행|바다|노을|일출/.test(text)) choices=['🌅','✨','🙂'];
                else if (/운동|러닝|달리|자전거/.test(text)) choices=['💪','👏','🙂'];
                else if (/코드|프로그램|버그/.test(text)) choices=['💻','🙌','🙂'];
                else if (/책|공부|과제|도서관|문제/.test(text)) choices=['📚','📝','🙂'];
                else if (/노래|음악|기타/.test(text)) choices=['🎧','🎵','🙂'];
                else if (/꽃|화분|산책|하늘/.test(text)) choices=['🌿','✨','🙂'];
                else choices=['🙂','✨','😊'];
            }
            item.emoji=choices[stableHash(key+':tone')%choices.length];
        }
        function decoratePosts(posts) {
            const dummyIds=new Set(pool.map(person=>person.id));
            for (const post of posts) {
                if(post.demo && dummyIds.has(post.authorId)) decorate(post,`post:${post.id}`,post,'post');
                const visit=comments=> {for(const comment of comments||[]) {
                    if(comment.simulated && dummyIds.has(comment.authorId)) decorate(comment,`comment:${post.id}:${comment.id}`,post,'comment');
                    visit(comment.replies);
                }};
                visit(post.comments);
            }
        }
        function savePosts(posts) { decoratePosts(posts); return write('fakebookPosts',posts); }
        function negativeCandidates(post) { return conversationOptions(post).map(pair=>pair.negative); }
        function repairConversations(posts) {
            for (const post of posts) post.comments = (post.comments || []).filter(comment=> {
                if (!comment.negative || !comment.simulated || comment.negativeContextVersion === 2) return true;
                const pair = conversationPair(post);
                const engaged = comment.likedBy?.length || comment.updatedAt || (comment.replies||[]).some(reply=>!reply.defense || reply.likedBy?.length || reply.updatedAt);
                if (engaged) {
                    if (comment.defensePlan) comment.defensePlan.cancelled = true;
                    comment.negativeContextVersion = 2; return true;
                }
                if (!pair) return false; // 사용자 상호작용이 없는 옛 자동 댓글만 정리합니다.
                comment.text=pair.negative; comment.negativePairId=pair.id; comment.negativeContextText=normalizeContext(post.text); comment.negativeContextVersion=2;
                for (const reply of comment.replies || []) if (reply.defense) reply.text=pair.defense;
                return true;
            });
        }
        function autoComment(post, accountId, normal, rate, force = false) {
            const result = {...normal,civilityReviewed:true};
            if (!accountId) return result;
            const key = `fakebookConversation:${accountId}`, state = read(key,{}), time = now();
            let blunt = pool.filter(person=>person.temperament==='blunt' && person.id!==post.authorId && !(post.comments||[]).some(c=>c.authorId===person.id));
            if (force && !blunt.length) blunt=pool.filter(person=>person.temperament==='blunt' && person.id!==post.authorId);
            const options = conversationOptions(post);
            const allowed = options.length && !post.negativeCommentUsed && !(post.comments||[]).some(c=>c.negative) && (force || (!state.lastWasNegative && time >= (state.nextNegativeAt || 0)));
            if (allowed && blunt.length && (force || random() < rate)) {
                const pair = pick(options);
                const person = pick(blunt);
                result.authorId = person.id; result.author = person.name; result.text = pair.negative;
                result.negative = true; result.negativeAt = time; result.negativePairId = pair.id; result.negativeContextText = normalizeContext(post.text); result.negativeContextVersion = 2;
                if (random() < .65) result.defensePlan = {accountId,dueAt:time+int(2,10)*MINUTE,done:false};
                post.negativeCommentUsed = true;
                state.nextNegativeAt = time + 5*MINUTE;
            }
            state.lastWasNegative = result.negative === true;
            write(key,state); return result;
        }
        const ownFallback = OWN_GENERAL_PAIRS[0];
        const additionalDefense = SECONDARY_DEFENSES[0];
        function tickOwnConversations(id) {
            const posts=read('fakebookPosts',[]), members=read('fakebookUsers',[]), time=now();
            if (!Array.isArray(posts)) return false;
            const original=JSON.stringify(posts); let budget=2;
            for (const post of posts) {
                const matches=members.filter(user=>user.name===post.author);
                const owner=post.authorId || (matches.length===1 ? matches[0].id : null);
                if (post.demo || owner!==id) continue;
                post.comments ||= [];
                let negative=post.comments.find(comment=>comment.negative);
                if (!post.ownConversation) {
                    post.ownConversation={dueAt:time+int(1,3)*MINUTE,started:false,completed:false};
                }
                const job=post.ownConversation;
                if (job.completed) continue;
                if (job.started) {
                    if (!post.comments.some(comment=>comment.id===job.commentId)) job.completed=true;
                    continue;
                }
                if (!negative) {
                    if (job.dueAt>time || !budget) continue;
                    const pair=pick(conversationOptions(post,true));
                    const people=pool.filter(person=>person.id!==id);
                    const blunt=people.filter(person=>person.temperament==='blunt');
                    const person=pick(blunt.length?blunt:people); if (!person) continue;
                    negative={id:`own-negative:${post.id}`,authorId:person.id,author:person.name,text:pair.negative,likedBy:[],simulated:true,negative:true,ownNegative:true,negativeAt:time,negativePairId:pair.id,negativeContextText:normalizeContext(post.text),negativeContextVersion:2,createdAt:new Date(time).toISOString()};
                    post.comments.push(negative); post.negativeCommentUsed=true; budget--;
                }
                const defenses=(negative.replies||[]).filter(reply=>reply.defense);
                const pair=resolveCommentPair(post,negative);
                const primary=pair ? pair.defense : ownFallback.defense;
                negative.defensePlan={accountId:id,guaranteed:true,dueAt:time+int(1,3)*MINUTE,target: defenses.length ? Math.min(2,defenses.length) : int(1,2),primaryDefense:primary,secondaryDefense:pick(SECONDARY_DEFENSES),done:defenses.length>0};
                job.started=true; job.commentId=negative.id; job.completed=negative.defensePlan.done;
            }
            return original!==JSON.stringify(posts) && savePosts(posts);
        }
        function tickDefenses(id) {
            const posts = read('fakebookPosts',[]); if (!Array.isArray(posts)) return false;
            const original = JSON.stringify(posts), time = now(); let budget = 2;
            for (const post of posts) for (const comment of post.comments || []) {
                const plan = comment.defensePlan;
                if (!comment.negative || !plan || plan.done || plan.cancelled || (plan.accountId && plan.accountId !== id)) continue;
                if (plan.guaranteed) {
                    if (!budget || plan.dueAt>time) continue;
                    const existing=(comment.replies||[]).filter(reply=>reply.defense);
                    const needed=Math.max(0,Math.min(2,plan.target||1)-existing.length);
                    const actors=new Set([comment.authorId,post.authorId,...(comment.replies||[]).map(reply=>reply.authorId)]);
                    const candidates=shuffle(pool.filter(person=>!actors.has(person.id) && person.temperament!=='blunt'));
                    comment.replies ||= [];
                    for (let i=0;i<needed && budget && candidates.length;i++) {
                        const person=candidates.shift(), ordinal=existing.length+i;
                        const sameContext=normalizeContext(post.text)===comment.negativeContextText;
                        const text=ordinal===0 ? (sameContext?plan.primaryDefense:ownFallback.defense) : (plan.secondaryDefense || additionalDefense);
                        comment.replies.push({id:`own-defense:${comment.id}:${ordinal}`,authorId:person.id,author:person.name,text,likedBy:[],simulated:true,defense:true,createdAt:new Date(time).toISOString()}); budget--;
                    }
                    plan.done=(comment.replies||[]).filter(reply=>reply.defense).length>=Math.min(2,plan.target||1);
                    if (plan.done && post.ownConversation) post.ownConversation.completed=true;
                    continue;
                }

                if (time-(comment.negativeAt || time) > LIMITS.postAge) { plan.cancelled=true; continue; }
                const pair = resolveCommentPair(post,comment);
                if (!pair || pair.id !== comment.negativePairId || pair.negative !== comment.text || normalizeContext(post.text) !== comment.negativeContextText) {plan.cancelled=true;continue;}
                if (!budget || plan.dueAt > time) continue;
                const replyId = `defense:${comment.id}`;
                if ((comment.replies||[]).some(reply=>reply.id===replyId || reply.defense)) {plan.done=true;continue;}
                const candidates = pool.filter(person=>person.id!==comment.authorId && person.id!==post.authorId && person.temperament!=='blunt');
                const person = pick(candidates); if (!person) {plan.cancelled=true;continue;}
                comment.replies ||= [];
                comment.replies.push({id:replyId,authorId:person.id,author:person.name,text:pair.defense,likedBy:[],simulated:true,defense:true,createdAt:new Date(Math.min(time,plan.dueAt)).toISOString()});
                plan.done=true; budget--;
            }
            return original!==JSON.stringify(posts) && savePosts(posts);
        }
        function recommendations(candidates, limit = LIMITS.recommendations) {
            const seen = new Set(), selected = [];
            for (const person of candidates) {
                const photo = person.avatar || 'img/default-avatar.svg';
                if (seen.has(photo)) continue;
                seen.add(photo); selected.push(person);
                if (selected.length >= limit) break;
            }
            return selected;
        }
        const contentKey = text => String(text || '').trim().replace(/\s+/g,' ');
        function eligibleHomePosts(posts) {
            const ownTexts=new Set(posts.filter(p=>!p.demo).map(p=>contentKey(p.text)));
            return posts.filter(p=>p.demo && contentKey(p.text) && !ownTexts.has(contentKey(p.text)));
        }
        function ensureHomeNegative(posts, accountId) {
            if (!accountId) return false;
            const candidates=eligibleHomePosts(posts);
            if (candidates.some(post=>(post.comments||[]).some(comment=>comment.negative))) return false;
            const chosen=shuffle(candidates.filter(post=>!post.negativeCommentUsed && conversationPair(post)))[0];
            if (!chosen) return false;
            // 최신 저장값을 다시 읽어 다른 상호작용을 덮어쓰지 않습니다.
            const live=read('fakebookPosts',[]); if (!Array.isArray(live)) return false;
            const target=live.find(post=>post.id===chosen.id);
            if (!target || target.negativeCommentUsed || (target.comments||[]).some(comment=>comment.negative)) return false;
            const normal={id:`home-negative:${target.id}`,authorId:'',author:'',text:'',likedBy:[],simulated:true,homeExample:true,createdAt:new Date(now()).toISOString()};
            const comment=autoComment(target,accountId,normal,1,true);
            if (!comment.negative) return false;
            target.comments ||= []; target.comments.push(comment);
            if (!savePosts(live)) return false;
            Object.assign(chosen,target); return true;
        }
        function selectHomePosts(posts, limit = 10, preferredIds = null) {
            if (limit<=0) return [];
            const candidates=eligibleHomePosts(posts), byId=new Map(candidates.map(post=>[post.id,post]));
            const preferred=(preferredIds||[]).map(id=>byId.get(id)).filter(Boolean);
            const rest=shuffle(candidates.filter(post=>!preferredIds?.includes(post.id)));
            const available=[...preferred,...rest];
            const featured=available.find(post=>(post.comments||[]).some(comment=>comment.negative));
            const seen=new Set(), authors=new Set(), selected=[];
            for (const post of [...(featured?[featured]:[]),...available]) {
                const key=contentKey(post.text);
                if (seen.has(key) || authors.has(post.authorId)) continue;
                seen.add(key); authors.add(post.authorId); selected.push(post.id);
                if (selected.length>=limit) break;
            }
            return selected;
        }
        function friends(id) { return read(`fakebookFriends:${id}`,{friends:[],dismissed:[],requests:[]}); }
        function tickRequests(id) {
            const key = `fakebookFriends:${id}`, time = now(), old = read(key,null);
            const s = old ? {...old} : {friends:[],dismissed:[],requests:shuffle(pool.map(p=>p.id)).slice(0,int(0,4))};
            s.friends = [...new Set(s.friends || [])]; s.dismissed = [...new Set(s.dismissed || [])];
            s.requests = [...new Set(s.requests || [])].filter(x=>!s.friends.includes(x)).slice(0,LIMITS.requests);
            s.requestExpiry = {...s.requestExpiry}; s.requestCooldown = {...s.requestCooldown};
            for (const [key,until] of Object.entries(s.requestCooldown)) if (until <= time) delete s.requestCooldown[key];
            for (const candidate of s.requests) {
                if (!s.requestExpiry[candidate]) s.requestExpiry[candidate] = time + int(25,150)*MINUTE;
                if (s.requestExpiry[candidate] <= time) s.requestCooldown[candidate] = time + 12*HOUR;
            }
            s.requests = s.requests.filter(candidate=>s.requestExpiry[candidate] > time);
            for (const key of Object.keys(s.requestExpiry)) if (!s.requests.includes(key)) delete s.requestExpiry[key];
            if (!Number.isFinite(s.nextRequestAt)) s.nextRequestAt = time + int(8,35)*MINUTE;
            if (s.nextRequestAt <= time) {
                const candidates = shuffle(pool.map(p=>p.id).filter(x=>!s.friends.includes(x)&&!s.requests.includes(x)&&!s.dismissed.includes(x)&&!s.requestCooldown[x]));
                const added = candidates.slice(0,Math.min(int(1,LIMITS.offlineRequests),LIMITS.requests-s.requests.length));
                for (const candidate of added) {s.requests.push(candidate); s.requestExpiry[candidate]=time+int(25,150)*MINUTE;}
                s.nextRequestAt = time + int(8,35)*MINUTE;
            }
            s.ambientVersion = 1;
            return JSON.stringify(old)!==JSON.stringify(s) && write(key,s);
        }
        function tickPosts(id) {
            const time=now(), posts=read('fakebookPosts',[]), members=read('fakebookUsers',[]);
            if (!Array.isArray(posts)) return false;
            const original=JSON.stringify(posts), known = new Set(pool.map(p=>p.id)); let budget=LIMITS.reactionsPerTick;
            const related=friends(id).friends || [];
            for (const post of posts) {
                const owner=post.authorId || (members.filter(u=>u.name===post.author).length===1 ? members.find(u=>u.name===post.author).id : null);
                const created=Date.parse(post.createdAt), age=time-created;
                if (owner!==id || post.demo || !Number.isFinite(age) || age<0 || age>LIMITS.postAge) continue;
                const meta=post.ambient || {nextAt:created+int(1,4)*MINUTE,likes:(post.likedBy||[]).filter(x=>known.has(x)).length,comments:(post.comments||[]).filter(c=>c.simulated && !c.ownNegative).length};
                post.ambient=meta;
                if (meta.nextAt>time) continue;
                // 미접속 기간 전체를 재생하지 않고 한 번의 제한된 배치로 처리합니다.
                const attempts=Math.min(2,budget); let due=Math.max(created+MINUTE,meta.nextAt);
                for(let n=0;n<attempts;n++) {
                    if (meta.likes>=LIMITS.likes && meta.comments>=LIMITS.comments) break;
                    if (random()>.7) continue;
                    const wantComment=random()<.24 && meta.comments<LIMITS.comments;
                    if (!wantComment && meta.likes>=LIMITS.likes) continue;
                    const blocked=wantComment ? (post.comments||[]).filter(c=>c.simulated).map(c=>c.authorId) : (post.likedBy||[]);
                    const available=pool.filter(p=>!blocked.includes(p.id));
                    const close=available.filter(p=>related.includes(p.id)); const person=pick(close.length && random()<.75?close:available);
                    if (!person) continue;
                    if (wantComment) {
                        const text=pick(positiveCandidates(post).filter(text=>!(post.comments||[]).some(c=>c.simulated&&c.text===text)));
                        if (!text) continue;
                        post.comments ||= [];
                        post.comments.push(autoComment(post,id,{id:`ambient:${post.id}:${person.id}:${meta.comments}`,authorId:person.id,author:person.name,text,likedBy:[],simulated:true,createdAt:new Date(Math.min(time,due)).toISOString()},0)); meta.comments++;
                    } else {post.likedBy ||= []; post.likedBy.push(person.id);meta.likes++;}
                    budget--; due+=MINUTE;
                }
                meta.nextAt=time+int(2,12)*MINUTE;
            }
            return original!==JSON.stringify(posts) && savePosts(posts);
        }
        function tick(id) { if (!id) return false; const requests=tickRequests(id); const own=tickOwnConversations(id); const posts=tickPosts(id); const defenses=tickDefenses(id); return Boolean(requests||own||posts||defenses); }
        return {boot,tick,tickRequests,tickPosts,tickOwnConversations,tickDefenses,autoComment,conversationPair,conversationOptions,resolveCommentPair,positiveCandidates,decoratePosts,negativeCandidates,friends,shuffle,recommendations,ensureHomeNegative,selectHomePosts,limits:LIMITS,get profiles(){return pool;}};
    }
    const api={create,LIMITS,TEXTS,CONTENT,AVATARS,TEMPLATE_PAIRS,OWN_PAIRS,OWN_COMMENT_PAIRS,POSITIVE_COMMENTS,SECONDARY_DEFENSES,NEGATIVE_COMMENTS,DEFENSE_COMMENTS};
    if (typeof module!=='undefined' && module.exports) module.exports=api;
    else scope.FakebookAmbient=api;
})(typeof window!=='undefined'?window:globalThis);







