from __future__ import annotations

import argparse
import json
from dataclasses import dataclass

import requests


API_BASE = "https://jhatpatai.bizskilledu.com/backend/api"
GET_COURSES_URL = f"{API_BASE}/get-courses.php"
SAVE_CONTENT_URL = f"{API_BASE}/save-content.php"


@dataclass
class Course:
    id: int
    name: str
    slug: str
    category: str | None
    created_at: str | None


def fetch_courses(session: requests.Session) -> list[Course]:
    response = session.get(GET_COURSES_URL, timeout=30)
    response.raise_for_status()
    payload = response.json()
    if payload.get("status") != "success":
        raise RuntimeError(f"Failed to fetch courses: {payload}")

    courses: list[Course] = []
    for item in payload.get("data", []):
        courses.append(
            Course(
                id=int(item["id"]),
                name=item["name"],
                slug=item["slug"],
                category=item.get("category"),
                created_at=item.get("created_at"),
            )
        )
    return courses


def print_courses(courses: list[Course]) -> None:
    if not courses:
        print("No courses found.")
        return

    print("Courses:")
    for index, course in enumerate(courses, start=1):
        created = course.created_at or "-"
        category = course.category or "General"
        print(f"{index}. {course.name}")
        print(f"   slug: {course.slug}")
        print(f"   category: {category}")
        print(f"   created_at: {created}")


def delete_course(session: requests.Session, course: Course) -> None:
    payload = {
        "type": "course",
        "slug": course.slug,
        "title": course.name,
        "status": "delete",
    }
    response = session.post(
        SAVE_CONTENT_URL,
        data={"json_data": json.dumps(payload)},
        timeout=30,
    )
    response.raise_for_status()
    body = response.json()
    if body.get("status") != "success":
        raise RuntimeError(f"Delete failed for {course.slug}: {body}")


def choose_course(courses: list[Course]) -> Course | None:
    if not courses:
        return None

    while True:
        print_courses(courses)
        answer = input("Enter course number to delete, or press Enter to cancel: ").strip()
        if not answer:
            return None
        if not answer.isdigit():
            print("Please enter a valid number.")
            continue

        index = int(answer)
        if 1 <= index <= len(courses):
            return courses[index - 1]

        print("Number out of range.")


def main() -> None:
    parser = argparse.ArgumentParser(description="List and delete live JhatPatAI courses.")
    parser.add_argument("--list", action="store_true", help="List courses and exit.")
    parser.add_argument("--delete-slug", help="Delete a course directly by slug.")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt.")
    args = parser.parse_args()

    session = requests.Session()
    courses = fetch_courses(session)

    if args.list:
        print_courses(courses)
        return

    target: Course | None = None
    if args.delete_slug:
        target = next((course for course in courses if course.slug == args.delete_slug), None)
        if target is None:
            raise RuntimeError(f"Course not found for slug: {args.delete_slug}")
    else:
        target = choose_course(courses)
        if target is None:
            print("Cancelled.")
            return

    if not args.yes:
        confirm = input(f"Delete '{target.name}' ({target.slug})? Type DELETE to confirm: ").strip()
        if confirm != "DELETE":
            print("Cancelled.")
            return

    delete_course(session, target)
    print(f"Deleted: {target.name} ({target.slug})")
    print()
    print("Remaining courses:")
    print_courses(fetch_courses(session))


if __name__ == "__main__":
    main()
