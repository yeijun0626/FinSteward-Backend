# 재정관리 AI 시스템 API 설계

이 문서는 재정관리 AI 시스템의 API 구조를 정의한다.
시스템은 사용자 관리, 조직 관리, 지출 관리, 영수증 OCR 처리, AI 소비 분석 기능을 제공한다.


--------------------------------------------------
1. 사용자 API
--------------------------------------------------

### 1.1 회원가입

POST /users/signup

설명  
사용자가 계정을 생성한다.  
회원 유형은 personal / company / organization 중 선택한다.

Request

{
  "email": "user@test.com",
  "password": "1234",
  "name": "홍길동",
  "account_type": "personal"
}

Response

{
  "user_id": 1,
  "message": "회원가입 성공"
}


### 1.2 로그인

POST /users/login

설명  
사용자가 로그인한다.

Request

{
  "email": "user@test.com",
  "password": "1234"
}

Response

{
  "user_id": 1,
  "token": "jwt_token_example"
}


### 1.3 사용자 정보 조회

GET /users/{user_id}

설명  
사용자의 기본 정보를 조회한다.

Response

{
  "user_id": 1,
  "name": "홍길동",
  "email": "user@test.com",
  "account_type": "personal"
}


--------------------------------------------------
2. 조직 API
--------------------------------------------------

### 2.1 조직 생성

POST /organizations

설명  
기업 또는 단체 조직을 생성한다.

Request

{
  "name": "ABC 회사",
  "type": "company"
}

Response

{
  "org_id": 1,
  "message": "조직 생성 완료"
}


### 2.2 조직 가입

POST /organizations/join

설명  
사용자가 조직에 가입한다.

Request

{
  "user_id": 1,
  "org_id": 1
}

Response

{
  "message": "조직 가입 완료"
}


### 2.3 조직 정보 조회

GET /organizations/{org_id}

설명  
조직의 정보를 조회한다.

Response

{
  "org_id": 1,
  "name": "ABC 회사",
  "type": "company"
}


--------------------------------------------------
3. 지출 API
--------------------------------------------------

### 3.1 지출 등록

POST /expenses

설명  
사용자가 지출 정보를 등록한다.

Request

{
  "user_id": 1,
  "category_id": 2,
  "amount": 12000,
  "description": "점심 식사",
  "expense_date": "2024-05-10"
}

Response

{
  "expense_id": 10,
  "message": "지출 등록 완료"
}


### 3.2 지출 목록 조회

GET /expenses

설명  
사용자의 지출 목록을 조회한다.

Request Parameter

user_id=1

Response

{
  "expenses": [
    {
      "expense_id": 10,
      "category": "식비",
      "amount": 12000,
      "date": "2024-05-10"
    }
  ]
}


### 3.3 지출 상세 조회

GET /expenses/{expense_id}

설명  
특정 지출의 상세 정보를 조회한다.

Response

{
  "expense_id": 10,
  "category": "식비",
  "amount": 12000,
  "description": "점심 식사",
  "expense_date": "2024-05-10"
}


### 3.4 지출 삭제

DELETE /expenses/{expense_id}

설명  
지출 데이터를 삭제한다.

Response

{
  "message": "지출 삭제 완료"
}


--------------------------------------------------
4. 영수증 API
--------------------------------------------------

### 4.1 영수증 업로드

POST /receipts/upload

설명  
사용자가 영수증 이미지를 업로드한다.

Request

{
  "expense_id": 10,
  "image_file": "receipt.jpg"
}

Response

{
  "receipt_id": 5,
  "message": "영수증 업로드 완료"
}


### 4.2 OCR 분석

POST /receipts/ocr

설명  
영수증 이미지를 OCR로 분석하여 텍스트를 추출한다.

Request

{
  "receipt_id": 5
}

Response

{
  "store_name": "김밥천국",
  "total_amount": 12000,
  "purchase_date": "2024-05-10"
}


### 4.3 영수증 조회

GET /receipts/{receipt_id}

설명  
영수증 정보를 조회한다.

Response

{
  "receipt_id": 5,
  "store_name": "김밥천국",
  "purchase_date": "2024-05-10",
  "image_url": "receipt_5.jpg"
}


--------------------------------------------------
5. AI 분석 API
--------------------------------------------------

### 5.1 소비 패턴 분석

POST /ai/analyze

설명  
사용자의 소비 패턴을 AI가 분석한다.

Request

{
  "user_id": 1
}

Response

{
  "analysis_id": 3,
  "result": "식비 지출이 평균보다 높습니다."
}


### 5.2 소비 리포트 조회

GET /ai/report/{user_id}

설명  
AI가 생성한 소비 분석 리포트를 조회한다.

Response

{
  "user_id": 1,
  "report": "최근 한 달 동안 식비 지출이 증가했습니다."
}