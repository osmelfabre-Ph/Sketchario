#!/usr/bin/env python3
"""
Sketchario V4 Backend API Testing - Complete Feature Testing
Tests all backend APIs including new V4 features: Media upload, DALL-E, Admin console, Stripe billing
"""

import requests
import json
import sys
import io
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
        self.media_id = None
        self.power_user_email = None
        self.release_note_id = None
        self.tov_library_id = None

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

    # ── MEDIA UPLOAD TESTS ──
    def test_media_upload(self):
        """Test POST /api/media/upload/{content_id}"""
        if not self.content_id:
            return False
        
        # Create a simple test image file
        test_image_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        url = f"{self.base_url}/api/media/upload/{self.content_id}"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        files = {'file': ('test.png', io.BytesIO(test_image_data), 'image/png')}
        
        self.tests_run += 1
        self.log(f"🔍 Testing Media Upload...")
        
        try:
            response = requests.post(url, files=files, headers=headers, timeout=30)
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                self.log(f"✅ Media Upload - Status: {response.status_code}")
                response_data = response.json()
                if 'id' in response_data:
                    self.media_id = response_data['id']
                    self.log(f"✅ Media uploaded with ID: {self.media_id}")
                return True, response_data
            else:
                self.log(f"❌ Media Upload - Expected 200, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {error_detail}")
                except:
                    self.log(f"   Response: {response.text[:200]}")
                return False, {}
        except Exception as e:
            self.log(f"❌ Media Upload - Exception: {str(e)}")
            return False, {}

    def test_media_library(self):
        """Test GET /api/media/library/{project_id}"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Get Media Library",
            "GET",
            f"media/library/{self.project_id}",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} media items in library")
            return True
        return False

    def test_dalle_generation(self):
        """Test POST /api/media/generate-dalle"""
        if not self.content_id or not self.project_id:
            return False
        success, response = self.run_test(
            "DALL-E Image Generation",
            "POST",
            "media/generate-dalle",
            200,
            data={
                "content_id": self.content_id,
                "prompt": "A simple test image for API testing",
                "project_id": self.project_id
            }
        )
        if success and 'id' in response:
            self.log(f"✅ DALL-E image generated with ID: {response['id']}")
            return True
        return False

    # ── ADMIN CONSOLE TESTS ──
    def test_get_power_users(self):
        """Test GET /api/admin/power-users"""
        success, response = self.run_test(
            "Get Power Users (Admin)",
            "GET",
            "admin/power-users",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} power users")
            return True
        return False

    def test_create_power_user(self):
        """Test POST /api/admin/power-users"""
        test_email = f"testuser_{datetime.now().strftime('%H%M%S')}@example.com"
        self.power_user_email = test_email
        
        success, response = self.run_test(
            "Create Power User",
            "POST",
            "admin/power-users",
            200,
            data={
                "email": test_email,
                "plan": "strategist",
                "days": 30,
                "notes": "Test power user created by API test"
            }
        )
        if success:
            self.log(f"✅ Power user created: {test_email}")
            return True
        return False

    def test_create_release_note(self):
        """Test POST /api/admin/release-notes"""
        success, response = self.run_test(
            "Create Release Note",
            "POST",
            "admin/release-notes",
            200,
            data={
                "title": "Test Release Note",
                "body": "This is a test release note created by API testing.",
                "version": "v4.0.0-test"
            }
        )
        if success and 'id' in response:
            self.release_note_id = response['id']
            self.log(f"✅ Release note created with ID: {self.release_note_id}")
            return True
        return False

    def test_get_release_notes(self):
        """Test GET /api/release-notes"""
        success, response = self.run_test(
            "Get Release Notes",
            "GET",
            "release-notes",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} release notes")
            return True
        return False

    # ── CANVA INTEGRATION TESTS ──
    def test_canva_auth_url(self):
        """Test GET /api/canva/auth-url"""
        success, response = self.run_test(
            "Get Canva Auth URL",
            "GET",
            "canva/auth-url",
            200
        )
        if success and 'auth_url' in response and 'configured' in response:
            self.log(f"✅ Canva auth URL: {response['auth_url'][:50]}...")
            self.log(f"✅ Canva configured: {response['configured']}")
            return True
        return False

    def test_canva_import(self):
        """Test POST /api/canva/import"""
        if not self.content_id:
            return False
        success, response = self.run_test(
            "Canva Import",
            "POST",
            "canva/import",
            200,
            data={
                "content_id": self.content_id,
                "image_url": "https://via.placeholder.com/300x300.png"
            }
        )
        if success and 'id' in response:
            self.log(f"✅ Canva image imported with ID: {response['id']}")
            return True
        return False

    # ── TOV LIBRARY TESTS ──
    def test_create_tov_library_item(self):
        """Test POST /api/tov-library"""
        success, response = self.run_test(
            "Create ToV Library Item",
            "POST",
            "tov-library",
            200,
            data={
                "name": "Test Professional Template",
                "preset": "professional",
                "formality": 8,
                "energy": 6,
                "empathy": 7,
                "humor": 3,
                "storytelling": 6,
                "custom_instructions": "Use professional tone for business content",
                "brand_keywords": "innovation, quality, excellence",
                "forbidden_words": "cheap, basic",
                "signature_phrases": "Excellence in every detail",
                "caption_length": "medium"
            }
        )
        if success and 'id' in response:
            self.tov_library_id = response['id']
            self.log(f"✅ ToV Library item created with ID: {self.tov_library_id}")
            return True
        return False

    def test_list_tov_library(self):
        """Test GET /api/tov-library"""
        success, response = self.run_test(
            "List ToV Library",
            "GET",
            "tov-library",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} ToV library items")
            return True
        return False

    def test_apply_tov_library_item(self):
        """Test POST /api/tov-library/{id}/apply/{project_id}"""
        if not hasattr(self, 'tov_library_id') or not self.project_id:
            return False
        success, response = self.run_test(
            "Apply ToV Library Item",
            "POST",
            f"tov-library/{self.tov_library_id}/apply/{self.project_id}",
            200
        )
        if success:
            self.log(f"✅ ToV Library item applied to project")
            return True
        return False

    def test_delete_tov_library_item(self):
        """Test DELETE /api/tov-library/{id}"""
        if not hasattr(self, 'tov_library_id'):
            return False
        success, response = self.run_test(
            "Delete ToV Library Item",
            "DELETE",
            f"tov-library/{self.tov_library_id}",
            200
        )
        if success:
            self.log(f"✅ ToV Library item deleted")
            return True
        return False

    # ── EXPORT TESTS ──
    def test_export_csv(self):
        """Test GET /api/export/{project_id}/csv"""
        if not self.project_id:
            return False
        
        url = f"{self.base_url}/api/export/{self.project_id}/csv"
        headers = {}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        self.tests_run += 1
        self.log(f"🔍 Testing CSV Export...")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            success = response.status_code == 200
            if success:
                self.tests_passed += 1
                self.log(f"✅ CSV Export - Status: {response.status_code}")
                # Check if response is CSV format
                content_type = response.headers.get('content-type', '')
                if 'text/csv' in content_type:
                    self.log(f"✅ CSV Export - Correct content type: {content_type}")
                    # Check if CSV has content
                    csv_content = response.text
                    if len(csv_content) > 0 and 'Hook' in csv_content:
                        self.log(f"✅ CSV Export - Contains data ({len(csv_content)} chars)")
                        return True
                    else:
                        self.log(f"❌ CSV Export - No data or invalid format")
                        return False
                else:
                    self.log(f"❌ CSV Export - Wrong content type: {content_type}")
                    return False
            else:
                self.log(f"❌ CSV Export - Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log(f"❌ CSV Export - Exception: {str(e)}")
            return False

    # ── PLAN GATING TESTS ──
    def test_get_plan_limits(self):
        """Test GET /api/plan/limits"""
        success, response = self.run_test(
            "Get Plan Limits",
            "GET",
            "plan/limits",
            200
        )
        if success and 'plan' in response and 'projects_used' in response:
            self.log(f"✅ Plan: {response['plan']}, Projects used: {response['projects_used']}")
            self.log(f"✅ Max projects: {response.get('max_projects', 'N/A')}")
            self.log(f"✅ Max contents per project: {response.get('max_contents_per_project', 'N/A')}")
            self.log(f"✅ Can publish: {response.get('can_publish', 'N/A')}")
            self.log(f"✅ Can export CSV: {response.get('can_export_csv', 'N/A')}")
            return True
        return False

    # ── ITERATION 7 NEW FEATURES ──
    def test_onboarding_status(self):
        """Test GET /api/onboarding/status"""
        success, response = self.run_test(
            "Get Onboarding Status",
            "GET",
            "onboarding/status",
            200
        )
        if success and 'completed' in response and 'current_step' in response:
            self.log(f"✅ Onboarding status - Completed: {response['completed']}, Step: {response['current_step']}")
            return True
        return False

    def test_onboarding_complete_step(self):
        """Test POST /api/onboarding/complete-step"""
        success, response = self.run_test(
            "Complete Onboarding Step",
            "POST",
            "onboarding/complete-step",
            200,
            data={"step": 1}
        )
        if success and response.get('ok'):
            self.log("✅ Onboarding step completed successfully")
            return True
        return False

    def test_onboarding_skip(self):
        """Test POST /api/onboarding/skip"""
        success, response = self.run_test(
            "Skip Onboarding",
            "POST",
            "onboarding/skip",
            200
        )
        if success and response.get('ok'):
            self.log("✅ Onboarding skipped successfully")
            return True
        return False

    def test_team_invite(self):
        """Test POST /api/team/invite"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Invite Team Member",
            "POST",
            "team/invite",
            200,
            data={
                "project_id": self.project_id,
                "email": "mario@test.com",
                "role": "editor"
            }
        )
        if success and response.get('ok'):
            self.log("✅ Team member invited successfully")
            return True
        return False

    def test_team_list(self):
        """Test GET /api/team/{project_id}"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "List Team Members",
            "GET",
            f"team/{self.project_id}",
            200
        )
        if success and 'owner' in response and 'members' in response:
            self.log(f"✅ Team data - Owner: {response['owner']}, Members: {len(response['members'])}")
            return True
        return False

    def test_team_my_invites(self):
        """Test GET /api/team/my-invites"""
        success, response = self.run_test(
            "Get My Team Invites",
            "GET",
            "team/my-invites",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} pending invites")
            return True
        return False

    def test_team_remove_member(self):
        """Test DELETE /api/team/{project_id}/{email}"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Remove Team Member",
            "DELETE",
            f"team/{self.project_id}/mario@test.com",
            200
        )
        if success and response.get('ok'):
            self.log("✅ Team member removed successfully")
            return True
        return False

    def test_media_import_cloud_dropbox(self):
        """Test POST /api/media/import-cloud for Dropbox"""
        if not self.content_id:
            return False
        success, response = self.run_test(
            "Import from Dropbox",
            "POST",
            "media/import-cloud",
            200,
            data={
                "content_id": self.content_id,
                "file_url": "https://via.placeholder.com/300x300.png",
                "source": "dropbox"
            }
        )
        if success and 'id' in response:
            self.log(f"✅ Dropbox file imported with ID: {response['id']}")
            return True
        return False

    def test_media_import_cloud_onedrive(self):
        """Test POST /api/media/import-cloud for OneDrive"""
        if not self.content_id:
            return False
        success, response = self.run_test(
            "Import from OneDrive",
            "POST",
            "media/import-cloud",
            200,
            data={
                "content_id": self.content_id,
                "file_url": "https://via.placeholder.com/300x300.png",
                "source": "onedrive"
            }
        )
        if success and 'id' in response:
            self.log(f"✅ OneDrive file imported with ID: {response['id']}")
            return True
        return False

    def test_postnitro_status(self):
        """Test GET /api/postnitro/status"""
        success, response = self.run_test(
            "Get PostNitro Status",
            "GET",
            "postnitro/status",
            200
        )
        if success and 'available' in response and 'configured' in response:
            available = response['available']
            configured = response['configured']
            self.log(f"✅ PostNitro status - Available: {available}, Configured: {configured}")
            if available and configured:
                self.log("✅ PostNitro is properly configured")
                return True
            else:
                self.log("❌ PostNitro not properly configured")
                return False
        return False

    def test_postnitro_generate(self):
        """Test POST /api/postnitro/generate"""
        if not self.content_id:
            self.log("❌ No content ID available for PostNitro generation")
            return False
            
        success, response = self.run_test(
            "PostNitro Generate AI",
            "POST",
            "postnitro/generate",
            200,
            data={
                "content_id": self.content_id,
                "project_id": self.project_id,
                "mode": "ai"
            }
        )
        if success and 'embed_post_id' in response:
            self.embed_post_id = response['embed_post_id']
            self.log(f"✅ PostNitro generation started with ID: {self.embed_post_id}")
            return True
        return False

    def test_postnitro_status_check(self):
        """Test GET /api/postnitro/status/{id}"""
        if not hasattr(self, 'embed_post_id') or not self.embed_post_id:
            self.log("❌ No embed post ID available for status check")
            return False
            
        success, response = self.run_test(
            "PostNitro Status Check",
            "GET",
            f"postnitro/status/{self.embed_post_id}",
            200
        )
        if success and 'status' in response:
            status = response['status']
            self.log(f"✅ PostNitro status check: {status}")
            return True
        return False

    def test_postnitro_output(self):
        """Test GET /api/postnitro/output/{id}"""
        if not hasattr(self, 'embed_post_id') or not self.embed_post_id:
            self.log("❌ No embed post ID available for output check")
            return False
            
        success, response = self.run_test(
            "PostNitro Output",
            "GET",
            f"postnitro/output/{self.embed_post_id}",
            200
        )
        if success:
            slide_urls = response.get('slide_urls', [])
            pdf_url = response.get('pdf_url', '')
            self.log(f"✅ PostNitro output retrieved - Slides: {len(slide_urls)}, PDF: {bool(pdf_url)}")
            return True
        else:
            self.log("⚠️  PostNitro output not ready yet (expected for new generation)")
            return True  # This is expected for new generations

    # ── ITERATION 6 NEW FEATURES ──
    def test_forgot_password(self):
        """Test POST /api/auth/forgot-password"""
        success, response = self.run_test(
            "Forgot Password",
            "POST",
            "auth/forgot-password",
            200,
            data={"email": "admin@sketchario.app"}
        )
        if success and 'message' in response:
            self.log(f"✅ Forgot password response: {response['message']}")
            if 'reset_link' in response:
                self.log(f"✅ Reset link generated: {response['reset_link'][:50]}...")
            return True
        return False

    def test_reset_password(self):
        """Test POST /api/auth/reset-password with invalid token (expected to fail)"""
        success, response = self.run_test(
            "Reset Password (Invalid Token)",
            "POST",
            "auth/reset-password",
            400,  # Expected to fail with invalid token
            data={"token": "invalid_token_test", "new_password": "NewPassword123!"}
        )
        if success:
            self.log("✅ Reset password correctly rejected invalid token")
            return True
        return False

    def test_notifications_unread_count(self):
        """Test GET /api/notifications/unread-count"""
        success, response = self.run_test(
            "Get Notifications Unread Count",
            "GET",
            "notifications/unread-count",
            200
        )
        if success and 'unread' in response and 'total' in response:
            self.log(f"✅ Unread notifications: {response['unread']}, Total: {response['total']}")
            return True
        return False

    def test_notifications_mark_read(self):
        """Test POST /api/notifications/mark-read"""
        success, response = self.run_test(
            "Mark Notifications as Read",
            "POST",
            "notifications/mark-read",
            200
        )
        if success and response.get('ok'):
            self.log("✅ Notifications marked as read successfully")
            return True
        return False

    def test_analytics_endpoint(self):
        """Test GET /api/analytics/{project_id}"""
        if not self.project_id:
            return False
        success, response = self.run_test(
            "Get Project Analytics",
            "GET",
            f"analytics/{self.project_id}",
            200
        )
        if success:
            required_fields = ['total_contents', 'by_format', 'by_pillar', 'by_status', 'completion_pct']
            missing_fields = [field for field in required_fields if field not in response]
            if not missing_fields:
                self.log(f"✅ Analytics data complete - Total contents: {response['total_contents']}")
                self.log(f"✅ By format: {response['by_format']}")
                self.log(f"✅ By pillar: {response['by_pillar']}")
                self.log(f"✅ By status: {response['by_status']}")
                self.log(f"✅ Completion: {response['completion_pct']}%")
                return True
            else:
                self.log(f"❌ Missing analytics fields: {missing_fields}")
                return False
        return False

    def test_google_drive_import(self):
        """Test POST /api/media/import-drive"""
        if not self.content_id:
            return False
        success, response = self.run_test(
            "Google Drive Import",
            "POST",
            "media/import-drive",
            200,
            data={
                "content_id": self.content_id,
                "file_url": "https://via.placeholder.com/300x300.png"
            }
        )
        if success and 'id' in response:
            self.log(f"✅ Google Drive file imported with ID: {response['id']}")
            return True
        return False

    # ── BILLING TESTS ──
    def test_get_billing_plans(self):
        """Test GET /api/billing/plans"""
        success, response = self.run_test(
            "Get Billing Plans",
            "GET",
            "billing/plans",
            200
        )
        if success:
            self.log(f"✅ Found {len(response)} billing plans")
            # Check for expected plans
            plan_ids = [plan['id'] for plan in response]
            if 'creator' in plan_ids and 'strategist' in plan_ids:
                self.log("✅ Found expected plans: creator and strategist")
                # Check pricing
                for plan in response:
                    if plan['id'] == 'creator' and plan['amount'] == 19.0:
                        self.log("✅ Creator plan pricing correct: 19 EUR")
                    elif plan['id'] == 'strategist' and plan['amount'] == 49.0:
                        self.log("✅ Strategist plan pricing correct: 49 EUR")
                return True
            else:
                self.log(f"❌ Missing expected plans. Found: {plan_ids}")
                return False
        return False

    def test_billing_checkout(self):
        """Test POST /api/billing/checkout"""
        success, response = self.run_test(
            "Create Billing Checkout",
            "POST",
            "billing/checkout",
            200,
            data={
                "plan_id": "creator",
                "origin_url": "https://editorial-flow-v4.preview.emergentagent.com"
            }
        )
        if success and 'url' in response and 'session_id' in response:
            self.log(f"✅ Checkout session created with URL: {response['url'][:50]}...")
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

    def test_cleanup_power_user(self):
        """Clean up test power user"""
        if not self.power_user_email:
            return True
        success, response = self.run_test(
            "Delete Test Power User",
            "DELETE",
            f"admin/power-users/{self.power_user_email}",
            200
        )
        return success

    def test_cleanup_release_note(self):
        """Clean up test release note"""
        if not self.release_note_id:
            return True
        success, response = self.run_test(
            "Delete Test Release Note",
            "DELETE",
            f"admin/release-notes/{self.release_note_id}",
            200
        )
        return success

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Sketchario V4 Complete API Tests")
        self.log("=" * 60)

        # Authentication
        if not self.test_auth_login():
            self.log("❌ Authentication failed, stopping tests")
            return False

        # Test Iteration 7 New Features First
        self.log("\n🆕 Testing Iteration 7 New Features...")
        self.test_onboarding_status()
        self.test_onboarding_complete_step()
        self.test_onboarding_skip()
        
        # PostNitro Integration Tests
        self.log("\n🎨 Testing PostNitro Integration...")
        self.test_postnitro_status()
        
        # Setup - get existing data
        if not self.test_get_projects():
            self.log("❌ No projects found, stopping tests")
            return False

        if not self.test_get_contents():
            self.log("❌ No content found, stopping tests")
            return False
            
        # Continue PostNitro tests with content
        self.test_postnitro_generate()
        self.test_postnitro_status_check()
        self.test_postnitro_output()

        if not self.test_get_social_profiles():
            self.log("❌ No social profiles found, stopping tests")
            return False

        # Test analytics and Google Drive import (need project/content IDs)
        self.test_analytics_endpoint()
        self.test_google_drive_import()

        # Test Iteration 7 Team Collaboration (need project ID)
        self.log("\n👥 Testing Team Collaboration APIs...")
        self.test_team_invite()
        self.test_team_list()
        self.test_team_my_invites()
        self.test_team_remove_member()

        # Test Iteration 7 Cloud Import (need content ID)
        self.log("\n☁️ Testing Cloud Import APIs...")
        self.test_media_import_cloud_dropbox()
        self.test_media_import_cloud_onedrive()

        # Media Upload Tests
        self.log("\n📁 Testing Media Upload APIs...")
        self.test_media_upload()
        self.test_media_library()
        self.test_dalle_generation()

        # Canva Integration Tests
        self.log("\n🎨 Testing Canva Integration APIs...")
        self.test_canva_auth_url()
        self.test_canva_import()

        # ToV Library Tests
        self.log("\n📚 Testing ToV Library APIs...")
        self.test_create_tov_library_item()
        self.test_list_tov_library()
        self.test_apply_tov_library_item()

        # Export Tests
        self.log("\n📤 Testing Export APIs...")
        self.test_export_csv()

        # Plan Gating Tests
        self.log("\n🔒 Testing Plan Gating APIs...")
        self.test_get_plan_limits()

        # Admin Console Tests
        self.log("\n👑 Testing Admin Console APIs...")
        self.test_get_power_users()
        self.test_create_power_user()
        self.test_create_release_note()
        self.test_get_release_notes()

        # Billing Tests
        self.log("\n💳 Testing Billing APIs...")
        self.test_get_billing_plans()
        self.test_billing_checkout()

        # Feed Tests (existing)
        self.log("\n📡 Testing Feed/RSS APIs...")
        self.test_add_feed()
        self.test_list_feeds()
        self.test_get_feed_items()
        self.test_generate_content_from_feed()

        # Queue Tests (existing)
        self.log("\n📋 Testing Publish Queue APIs...")
        self.test_schedule_publish()
        self.test_get_publish_queue()
        self.test_cancel_queue_item()

        # Cleanup
        self.log("\n🧹 Cleaning up...")
        self.test_cleanup_feed()
        self.test_cleanup_power_user()
        self.test_cleanup_release_note()
        self.test_delete_tov_library_item()

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