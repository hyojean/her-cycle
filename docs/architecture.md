# 아키텍처 결정 사항

## 현재 방향

`women-cycle`을 공식 프론트엔드 프로젝트로 사용한다.

현재 제품은 Vite + React 기반의 단일 페이지 웹앱(SPA)이다. MVP 개발, 기능 검증, 웹 배포는 `women-cycle`을 기준으로 진행한다.

`cycle-app`은 GitHub 협업 흐름과 별개로 개발된 Expo + React Native 구현체다. 이 프로젝트는 통째로 병합할 대상이 아니라, 참고용 프로젝트이자 향후 모바일 앱 후보로 본다.

## 프로젝트 역할

### `women-cycle`

- 메인 제품 코드베이스
- Vite + React 웹앱
- `react-router-dom` 기반 라우팅 사용
- 브라우저 API와 CSS 기반 레이아웃 사용
- 현재 UI, UX, 프론트엔드 구조의 기준
- Supabase 스키마 변경은 `supabase/migrations` 기준으로 관리

### `cycle-app`

- 참고용 구현체
- Expo + React Native 앱
- React Navigation과 네이티브 스타일 컴포넌트 사용
- 푸시 알림, 네이티브 카메라 흐름 등 모바일 앱 아이디어 포함
- 향후 모바일 앱 기획 또는 구현 시 참고 가능

## 병합 원칙

`cycle-app`을 `women-cycle`에 폴더 단위나 파일 단위로 그대로 병합하지 않는다.

`cycle-app`의 기능이 필요하다면 React Native 화면을 직접 복사하지 않고, `women-cycle`의 웹앱 구조에 맞게 다시 구현한다.

선별적으로 참고하거나 재사용할 수 있는 항목:

- Supabase 서비스 설계 아이디어
- 생리 주기 계산 로직
- 입력값 검증 규칙
- 다국어 문구 리소스
- 로그인 및 OAuth 흐름 아이디어
- 통계, 알림 관련 제품 아이디어

직접 가져오지 않을 항목:

- React Native 화면 컴포넌트
- Expo 전용 알림 코드
- React Navigation 설정
- React Native `StyleSheet` 기반 UI 코드
- Expo 앱 설정 파일
- `women-cycle`의 migration 구조와 충돌할 수 있는 독립 SQL 스키마

## 웹앱으로 가능한 범위

현재 웹앱 구조는 MVP 범위에 충분하다.

- 캘린더 및 생리 주기 기록
- 일기 작성 및 수정
- 콘텐츠 페이지
- 챗봇
- 제품명 또는 성분 검색
- 이미지 업로드
- 브라우저 카메라 접근을 통한 스캐너 MVP
- 앱 안 리마인더 및 알림 배너
- Supabase 기반 데이터 동기화
- 웹 OAuth 및 로그인 흐름

스캐너 탭의 카메라와 앨범 접근은 브라우저 API로 구현할 수 있다. 카메라는 `getUserMedia`, 앨범 선택은 파일 입력을 활용한다. MVP 수준의 스캐너 경험에는 충분하다.

## 네이티브 앱을 고려할 시점

다음 요구사항이 중요해지면 Expo 또는 React Native 앱이 더 적합하다.

- App Store 또는 Play Store 배포
- 더 안정적인 모바일 푸시 알림
- 로컬 예약 알림
- 더 정교한 카메라 및 바코드 스캔 UX
- 백그라운드 동작
- 네이티브 권한 처리

현재 웹앱을 네이티브 앱으로 전환하는 작업은 단순 수정이 아니다. 대부분의 UI 컴포넌트, 스타일, 라우팅, 카메라 연동, 알림 연동을 다시 작성해야 한다. 다만 비즈니스 로직, Supabase 스키마, 서비스 함수, 주기 계산 로직, 제품 흐름은 재사용할 수 있다.

## 권장 전략

1. MVP 개발은 `women-cycle`에서 계속 진행한다.
2. `cycle-app`은 병합 대상이 아니라 참고용 프로젝트로 유지한다.
3. 필요한 기능 아이디어만 `women-cycle`의 웹앱 구조에 맞게 선별 이식한다.
4. Supabase 스키마 변경은 `women-cycle/supabase/migrations`에서 관리한다.
5. 핵심 제품 UX가 검증된 뒤 Expo 또는 React Native 전환 여부를 다시 판단한다.
