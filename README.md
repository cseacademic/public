# cse.ac 기고 / Guest posts

[cse.ac](https://cse.ac)에 실리는 **기고 글**을 모으는 공개 저장소입니다. PR이 머지되면 사이트에 게시됩니다.

This is the public repository for **guest posts** on [cse.ac](https://cse.ac). A merged pull request is published on the site. *(English below.)*

## 기고하는 방법

가장 쉬운 방법은 [cse.ac/write](https://cse.ac/write) 에디터를 쓰는 것입니다.

1. 에디터에서 글을 씁니다. 초안은 브라우저에만 저장됩니다.
2. **게시**를 누르고 GitHub로 로그인합니다. 공개 저장소 권한(`public_repo`)만 요청합니다.
3. 처음 기고한다면 핸들(주소에 쓰일 영문 소문자, 숫자, `-`)과 표시 이름을 입력합니다.
4. 에디터가 이 저장소를 내 계정으로 fork하고 PR을 엽니다.
5. 검토 후 머지되면 `https://cse.ac/<핸들>/<슬러그>/`에 게시됩니다.

직접 PR을 올려도 됩니다. 파일 위치는 아래와 같습니다.

| 무엇 | 경로 |
| --- | --- |
| 글 (언어별 1파일) | `src/content/posts/<핸들>/<슬러그>/ko.md`, `en.md` |
| 저자 프로필 | `src/content/authors/<핸들>.json` |
| 이미지 | `public/media/<핸들>/<파일>.webp` 등 → 본문에서 `/media/<핸들>/<파일>`로 참조 |

글 파일은 frontmatter로 시작합니다.

```markdown
---
title: "글 제목"
date: 2026-11-02T00:00:00.000Z
description: "한 줄 요약 (선택)"
---

본문은 Markdown으로 씁니다.
```

저자 프로필(첫 PR에 함께 포함):

```json
{
  "handle": "my-handle",
  "display_name": "표시 이름",
  "bio": null,
  "avatar": null,
  "socials": ["https://github.com/my-login"],
  "github": "my-login"
}
```

### 규칙

- 한 PR에서는 **내 핸들의 파일만** 수정할 수 있습니다. `github`는 PR을 올리는 GitHub 계정이어야 하고, 한번 정한 `handle`과 `github`는 바꿀 수 없습니다.
- 본문은 **Markdown만** 씁니다. `<script>`, 이벤트 핸들러(`on…=`), `javascript:` 링크, YouTube 외의 `<iframe>` 같은 HTML은 거부됩니다.
- 이미지는 webp, png, jpg, gif만, 파일당 5MB까지입니다. 글 파일은 1MB까지입니다.
- PR 체크(`ownership`)를 통과하고 메인테이너 리뷰를 거쳐야 머지됩니다.
- PR은 공개되므로 머지 전 초안도 누구나 볼 수 있습니다.
- PR을 올리면 그 글을 cse.ac에 게시하는 데 동의하는 것으로 봅니다. 글의 저작권은 저자에게 있습니다.

---

## How to contribute

The easiest way is the [cse.ac/write](https://cse.ac/write) editor.

1. Write your post in the editor. Drafts stay in your browser.
2. Press **Publish** and sign in with GitHub. Only public-repository access (`public_repo`) is requested.
3. On your first post, choose a handle (lowercase letters, digits and `-`; it becomes your URL) and a display name.
4. The editor forks this repository to your account and opens a pull request.
5. Once it's reviewed and merged, the post goes live at `https://cse.ac/<handle>/<slug>/`.

You can also open a pull request by hand, with the files laid out like this:

| What | Path |
| --- | --- |
| Post (one file per language) | `src/content/posts/<handle>/<slug>/ko.md`, `en.md` |
| Author profile | `src/content/authors/<handle>.json` |
| Images | `public/media/<handle>/<file>.webp` etc., referenced as `/media/<handle>/<file>` |

See the Korean section above for the post frontmatter and profile formats.

### Rules

- A pull request may only touch **your own handle's files**. `github` must be the GitHub account opening the PR, and `handle` / `github` can't be changed later.
- Post bodies are **Markdown only**. HTML such as `<script>`, event handlers (`on…=`), `javascript:` links or non-YouTube `<iframe>`s is rejected.
- Images: webp, png, jpg or gif, up to 5 MB each. Post files: up to 1 MB.
- A PR is merged after the `ownership` check passes and a maintainer reviews it.
- Pull requests are public, so drafts are visible before they're merged.
- By opening a pull request you agree to the post being published on cse.ac. You keep the copyright to your writing.
