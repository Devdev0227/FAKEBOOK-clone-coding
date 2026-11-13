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
    const NEGATIVE_RULES = [
        {topic:'general', words:[], texts:['굳이 올릴 얘기인지는 모르겠네.','생각보다 별 내용은 없네.','나는 별로 공감이 안 된다.','조금 과장해서 말하는 느낌인데.','이 정도는 꽤 흔한 얘기 아닌가.','취향이 나랑은 많이 다르네.']},
        {topic:'food', words:['음식','쿠키','빵','카페','메뉴','집밥','볶음밥','식빵','과일','간식','점심','저녁'], texts:['맛은 생각보다 평범할 것 같은데.','보기만큼 맛있을지는 모르겠네.','그 메뉴가 그렇게 특별한가 싶다.','나는 다른 메뉴가 더 나아 보이네.']},
        {topic:'fitness', words:['운동','러닝','달리','운동화','자전거'], texts:['이 정도로 벌써 뿌듯해?','꾸준히 할 수 있을지는 봐야겠네.','기록은 아직 평범해 보이는데.','운동 얘기는 다 비슷하게 느껴진다.']},
        {topic:'travel', words:['여행','바다','노을','일출','산책','가방'], texts:['실제로는 사진만큼 좋을지 모르겠네.','너무 흔한 코스인 것 같은데.','나는 그쪽은 별로 끌리지 않더라.','기대한 것보다는 평범한 풍경이네.']},
        {topic:'study', words:['과제','공부','도서관','문제','코드','제출','마감'], texts:['그 정도는 기본 아닌가 싶네.','생각보다 오래 걸렸나 보네.','그게 그렇게 어려운 일이었나?','조금 더 일찍 끝낼 수도 있었겠는데.']},
        {topic:'hobby', words:['책','노래','음악','영화','기타','전시','그림','취미','보드게임'], texts:['나는 그 취향은 잘 모르겠다.','그렇게까지 추천할 정도인지는 모르겠네.','비슷한 게 너무 많은 것 같은데.','생각했던 것만큼 특별하지는 않네.']},
        {topic:'photo', words:['사진','앨범','꽃','하늘','화분','조명'], texts:['구도가 조금 아쉬워 보이네.','보정이 실제 분위기보다 강한 느낌인데.','비슷한 사진을 자주 본 것 같아.','이 사진이 특별한 이유는 잘 모르겠다.']}
    ];
    const NEGATIVE_COMMENTS = NEGATIVE_RULES.flatMap(rule=>rule.texts);
    const DEFENSE_COMMENTS = [
        '취향이 다를 수는 있는데 말은 조금 부드럽게 하자.',
        '그냥 일상 공유한 건데 그렇게 말할 필요는 없지.',
        '의견은 말할 수 있어도 상대를 깎아내리지는 말자.',
        '조금 더 배려해서 이야기하면 좋겠어.',
        '다르게 느꼈다면 그렇게만 말해도 충분하지 않을까?',
        '작은 성취라도 본인에게는 의미가 있을 수 있어.',
        '가볍게 나눈 이야기니까 너무 날카롭게 보지 말자.',
        '취향이 안 맞으면 그냥 지나가도 괜찮아.',
        '표현을 조금만 바꾸면 더 좋은 대화가 될 것 같아.',
        '여기서는 서로 기분 상하지 않게 이야기하자.',
        '비교보다는 각자의 경험을 존중해주면 좋겠다.',
        '상대가 즐거워하는 마음까지 평가할 필요는 없지.',
        '피드백도 조금 따뜻하게 전할 수 있잖아.',
        '누구에게나 자기 일상을 남길 공간은 필요하지.',
        '그렇게 단정하기보다는 한 번 더 생각해보자.',
        '다른 의견도 괜찮지만 말투는 배려해줬으면 해.',
        '굳이 기분 상할 표현까지 쓸 필요는 없을 것 같아.',
        '잘 모르겠다면 먼저 물어보는 건 어떨까?',
        '사소해 보여도 당사자에게는 소중한 기록일 수 있어.',
        '서로 존중하면서 편하게 이야기했으면 좋겠어.'
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
            if (original !== JSON.stringify(next)) write('fakebookPosts',next);
        }
        function conversationSettings(id) {
            return {negativeComments: read(`fakebookSimulation:${id}`,{}).negativeComments !== false};
        }
        function negativeCandidates(post) {
            const text = String(post.text || '');
            const matches = NEGATIVE_RULES.filter(rule=>rule.words.some(word=>text.includes(word)));
            // 일반 글에서 사진 구도/맛/운동 기록을 임의로 추정하지 않습니다.
            return matches.length ? matches.flatMap(rule=>rule.texts) : NEGATIVE_RULES[0].texts;
        }
        function autoComment(post, accountId, normal, rate) {
            const result = {...normal,civilityReviewed:true};
            if (!accountId) return result;
            const key = `fakebookConversation:${accountId}`, state = read(key,{}), time = now();
            const blunt = pool.filter(person=>person.temperament==='blunt' && person.id!==post.authorId && !(post.comments||[]).some(c=>c.authorId===person.id));
            const allowed = conversationSettings(accountId).negativeComments && !post.negativeCommentUsed && !(post.comments||[]).some(c=>c.negative) && !state.lastWasNegative && time >= (state.nextNegativeAt || 0);
            if (allowed && blunt.length && random() < rate) {
                const person = pick(blunt);
                result.authorId = person.id; result.author = person.name; result.text = pick(negativeCandidates(post));
                result.negative = true; result.negativeAt = time;
                if (random() < .65) result.defensePlan = {accountId,dueAt:time+int(2,10)*MINUTE,done:false};
                post.negativeCommentUsed = true;
                state.nextNegativeAt = time + 5*MINUTE;
            }
            state.lastWasNegative = result.negative === true;
            write(key,state); return result;
        }
        function tickDefenses(id) {
            const posts = read('fakebookPosts',[]); if (!Array.isArray(posts)) return false;
            const original = JSON.stringify(posts), time = now(); let budget = 2;
            for (const post of posts) for (const comment of post.comments || []) {
                const plan = comment.defensePlan;
                if (!comment.negative || !plan || plan.done || plan.cancelled || (plan.accountId && plan.accountId !== id)) continue;
                if (!conversationSettings(id).negativeComments || comment.hiddenBy?.includes(id) || time-(comment.negativeAt || time) > LIMITS.postAge) { plan.cancelled=true; continue; }
                if (!budget || plan.dueAt > time) continue;
                const replyId = `defense:${comment.id}`;
                if ((comment.replies||[]).some(reply=>reply.id===replyId || reply.defense)) {plan.done=true;continue;}
                const candidates = pool.filter(person=>person.id!==comment.authorId && person.id!==post.authorId && person.temperament!=='blunt');
                const person = pick(candidates); if (!person) {plan.cancelled=true;continue;}
                comment.replies ||= [];
                comment.replies.push({id:replyId,authorId:person.id,author:person.name,text:pick(DEFENSE_COMMENTS),likedBy:[],simulated:true,defense:true,createdAt:new Date(Math.min(time,plan.dueAt)).toISOString()});
                plan.done=true; budget--;
            }
            return original!==JSON.stringify(posts) && write('fakebookPosts',posts);
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
        function selectHomePosts(posts, limit = 10) {
            const seen = new Set(posts.filter(p=>!p.demo).map(p=>contentKey(p.text))), authors = new Set(), selected = [];
            for (const post of shuffle(posts.filter(p=>p.demo))) {
                const key = contentKey(post.text);
                if (!key || seen.has(key) || authors.has(post.authorId)) continue;
                seen.add(key); authors.add(post.authorId); selected.push(post.id);
                if (selected.length >= limit) break;
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
                const meta=post.ambient || {nextAt:created+int(1,4)*MINUTE,likes:(post.likedBy||[]).filter(x=>known.has(x)).length,comments:(post.comments||[]).filter(c=>c.simulated).length};
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
                        const text=pick(['잘 읽었어.','공유해줘서 고마워!','소식 잘 보고 가요.',...(post.media?.length ? ['사진·영상 잘 봤어!','기록 남겨줘서 고마워.'] : ['이야기 남겨줘서 고마워.','다음 소식도 기다릴게.'])].filter(text=>!(post.comments||[]).some(c=>c.simulated&&c.text===text)));
                        if (!text) continue;
                        post.comments ||= [];
                        post.comments.push(autoComment(post,id,{id:`ambient:${post.id}:${person.id}:${meta.comments}`,authorId:person.id,author:person.name,text,likedBy:[],simulated:true,createdAt:new Date(Math.min(time,due)).toISOString()},.03)); meta.comments++;
                    } else {post.likedBy ||= []; post.likedBy.push(person.id);meta.likes++;}
                    budget--; due+=MINUTE;
                }
                meta.nextAt=time+int(2,12)*MINUTE;
            }
            return original!==JSON.stringify(posts) && write('fakebookPosts',posts);
        }
        function tick(id) { if (!id) return false; const requests=tickRequests(id); const posts=tickPosts(id); const defenses=tickDefenses(id); return Boolean(requests||posts||defenses); }
        return {boot,tick,tickRequests,tickPosts,tickDefenses,autoComment,conversationSettings,negativeCandidates,friends,shuffle,recommendations,selectHomePosts,limits:LIMITS,get profiles(){return pool;}};
    }
    const api={create,LIMITS,TEXTS,CONTENT,AVATARS,NEGATIVE_COMMENTS,DEFENSE_COMMENTS};
    if (typeof module!=='undefined' && module.exports) module.exports=api;
    else scope.FakebookAmbient=api;
})(typeof window!=='undefined'?window:globalThis);



