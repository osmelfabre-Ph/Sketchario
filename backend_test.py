#!/usr/bin/env python3
"""
Sketchario V4 Backend API Testing - Feed/RSS and Publishing Queue
Tests all backend APIs for the new Feed and Queue features
"""

import requests
import json
import sys
from datetime import datetime, timedelta

class SketcharioAPITester:
    def __init__(self, base_url="https://editorial-flow-v4.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.content_id = None
        self.social_profile_id = None
        self.feed_id = None
        self.queue_item_id = None

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {error_detail}")
                except:
                    self.log(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Exception: {str(e)}")
            return False, {}

    def test_auth_login(self):
        """Test login with admin credentials"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@sketchario.app", "password": "Sketchario2026!"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.log(f"✅ Login successful, token acquired")
            return True
        return False

    def test_get_projects(self):
        """Get existing projects to use for testing"""
        success, response = self.run_test(
            "Get Projects",
            "GET", 
            "projects",
            200
        )
        if success and response and len(response) > 0:
            self.project_id = response[0]['id']
            self.log(f"✅ Using project ID: {self.project_id}")
            return True
        return False

    def test_get_contents(self):
        """Get existing content to use for queue testing"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Get Contents",
            "GET",
            f"contents/{self.project_id}",
            200
        )
        if success and response and len(response) > 0:
            self.content_id = response[0]['id']
            self.log(f"✅ Using content ID: {self.content_id}")
            return True
        return False

    def test_get_social_profiles(self):
        """Get existing social profiles for queue testing"""
        success, response = self.run_test(
            "Get Social Profiles",
            "GET",
            "social/profiles",
            200
        )
        if success and response and len(response) > 0:
            self.social_profile_id = response[0]['id']
            self.log(f"✅ Using social profile ID: {self.social_profile_id}")
            return True
        return False

    # ── FEED TESTS ──
    def test_add_feed(self):
        """Test POST /api/feeds/add"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Add RSS Feed",
            "POST",
            "feeds/add",
            200,
            data={
                "project_id": self.project_id,
                "feed_url": "https://feeds.feedburner.com/socialmediaexaminer",
                "feed_name": "Social Media Examiner Test"
            }
        )
        if success and 'id' in response:
            self.feed_id = response['id']
            self.log(f"✅ Feed created with ID: {self.feed_id}")
            return True
        return False

    def test_list_feeds(self):
        """Test GET /api/feeds/{project_id}"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "List Project Feeds",
            "GET",
            f"feeds/{self.project_id}",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} feeds")
            return True
        return False

    def test_get_feed_items(self):
        """Test GET /api/feeds/{project_id}/items"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Get Feed Items",
            "GET",
            f"feeds/{self.project_id}/items",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} feed items")
            return True
        return False

    def test_generate_content_from_feed(self):
        """Test POST /api/feeds/generate-content"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Generate Content from Feed",
            "POST",
            "feeds/generate-content",
            200,
            data={
                "project_id": self.project_id,
                "feed_item_title": "Test Article: 5 Social Media Trends",
                "feed_item_summary": "This article discusses the latest trends in social media marketing for 2024."
            }
        )
        if success and 'id' in response:
            self.log(f"✅ Content generated from feed with ID: {response['id']}")
            return True
        return False

    # ── PUBLISH QUEUE TESTS ──
    def test_schedule_publish(self):
        """Test POST /api/publish/schedule"""
        if not self.project_id or not self.content_id or not self.social_profile_id:
            self.log("❌ Missing required IDs for schedule test")
            return False
        
        # Schedule for tomorrow
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%dT10:00:00Z')
        
        success, response = self.run_test(
            "Schedule Content Publish",
            "POST",
            "publish/schedule",
            200,
            data={
                "content_id": self.content_id,
                "project_id": self.project_id,
                "social_profile_ids": [self.social_profile_id],
                "scheduled_at": tomorrow,
                "first_comment": "Test comment"
            }
        )
        if success and 'items' in response and len(response['items']) > 0:
            self.queue_item_id = response['items'][0]['id']
            self.log(f"✅ Content scheduled with queue item ID: {self.queue_item_id}")
            return True
        return False

    def test_get_publish_queue(self):
        """Test GET /api/publish/queue/{project_id}"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Get Publish Queue",
            "GET",
            f"publish/queue/{self.project_id}",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} queue items")
            return True
        return False

    def test_cancel_queue_item(self):
        """Test DELETE /api/publish/queue/{item_id}"""
        if not self.queue_item_id:
            return False
        success, response = self.run_test(
            "Cancel Queue Item",
            "DELETE",
            f"publish/queue/{self.queue_item_id}",
            200
        )
        if success:
            self.log(f"✅ Queue item cancelled successfully")
            return True
        return False

    # ── CLEANUP ──
    def test_cleanup_feed(self):
        """Clean up test feed"""
        if not self.feed_id:
            return True
        success, response = self.run_test(
            "Delete Test Feed",
            "DELETE",
            f"feeds/{self.feed_id}",
            200
        )
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Sketchario V4 Feed/RSS and Queue API Tests")
        self.log("=" * 60)

        # Authentication
        if not self.test_auth_login():
            self.log("❌ Authentication failed, stopping tests")
            return False

        # Setup - get existing data
        if not self.test_get_projects():
            self.log("❌ No projects found, stopping tests")
            return False

        if not self.test_get_contents():
            self.log("❌ No content found, stopping tests")
            return False

        if not self.test_get_social_profiles():
            self.log("❌ No social profiles found, stopping tests")
            return False

        # Feed Tests
        self.log("\n📡 Testing Feed/RSS APIs...")
        self.test_add_feed()
        self.test_list_feeds()
        self.test_get_feed_items()
        self.test_generate_content_from_feed()

        # Queue Tests
        self.log("\n📋 Testing Publish Queue APIs...")
        self.test_schedule_publish()
        self.test_get_publish_queue()
        self.test_cancel_queue_item()

        # Cleanup
        self.log("\n🧹 Cleaning up...")
        self.test_cleanup_feed()

        # Results
        self.log("\n" + "=" * 60)
        self.log(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            self.log("🎉 All tests passed!")
            return True
        else:
            self.log(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = SketcharioAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())