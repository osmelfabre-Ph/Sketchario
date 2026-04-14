#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class SketcharioAPITester:
    def __init__(self, base_url="https://editorial-flow-v4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})

    def run_test(self, name, method, endpoint, expected_status, data=None, auth_required=True):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth_required and self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200, auth_required=False)

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@sketchario.app", "password": "Sketchario2026!"},
            auth_required=False
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_register_new_user(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "TestPassword123!"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user,
            auth_required=False
        )
        return success

    def test_auth_me(self):
        """Test get current user"""
        return self.run_test("Get Current User", "GET", "auth/me", 200)

    def test_logout(self):
        """Test logout"""
        return self.run_test("Logout", "POST", "auth/logout", 200)

    def test_get_projects(self):
        """Test get projects list"""
        return self.run_test("Get Projects", "GET", "projects", 200)

    def test_create_project(self):
        """Test create project"""
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "sector": "Test Sector",
            "description": "Test project description",
            "objective_awareness": 60,
            "objective_education": 30,
            "objective_monetizing": 10,
            "formats": ["reel", "carousel"],
            "duration_weeks": 1,
            "geo": "Italy",
            "brief_notes": "Test notes"
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"   Project ID: {self.project_id}")
            return True
        return False

    def test_get_project(self):
        """Test get specific project"""
        if hasattr(self, 'project_id'):
            return self.run_test("Get Project", "GET", f"projects/{self.project_id}", 200)
        else:
            print("❌ Skipping - No project ID available")
            return False

    def test_profile_endpoints(self):
        """Test profile related endpoints"""
        # Get profile
        success1, _ = self.run_test("Get Profile", "GET", "profile", 200)
        
        # Update profile
        success2, _ = self.run_test(
            "Update Profile",
            "PUT",
            "profile",
            200,
            data={"name": "Updated Test Name", "sector": "Updated Sector"}
        )
        
        return success1 and success2

    def test_ai_generation_endpoints(self):
        """Test AI generation endpoints (if project exists)"""
        if not hasattr(self, 'project_id'):
            print("❌ Skipping AI tests - No project ID available")
            return False
            
        # Test personas generation
        success1, _ = self.run_test(
            "Generate Personas",
            "POST",
            "personas/generate",
            200,
            data={"project_id": self.project_id}
        )
        
        # Test ToV save
        success2, _ = self.run_test(
            "Save ToV Profile",
            "POST",
            "tov/save",
            200,
            data={
                "project_id": self.project_id,
                "formality": 5,
                "energy": 5,
                "empathy": 5,
                "humor": 3,
                "storytelling": 5,
                "caption_length": "medium"
            }
        )
        
        return success1 and success2

    def test_content_create_post(self):
        """Test new content creation endpoint"""
        if not hasattr(self, 'project_id'):
            print("❌ Skipping content creation test - No project ID available")
            return False
            
        # Test create post Da zero (manual)
        success1, response1 = self.run_test(
            "Create Post (Da zero)",
            "POST",
            "content/create-post",
            200,
            data={
                "project_id": self.project_id,
                "hook_text": "Test hook for manual post creation",
                "format": "reel",
                "use_ai": False
            }
        )
        
        if success1 and 'id' in response1:
            self.content_id = response1['id']
            print(f"   Content ID: {self.content_id}")
        
        # Test create post Con AI
        success2, _ = self.run_test(
            "Create Post (Con AI)",
            "POST",
            "content/create-post",
            200,
            data={
                "project_id": self.project_id,
                "hook_text": "Test hook for AI-generated post",
                "format": "carousel",
                "use_ai": True
            }
        )
        
        return success1 and success2

    def test_social_platforms(self):
        """Test social platforms endpoint"""
        success, response = self.run_test(
            "Get Social Platforms",
            "GET",
            "social/platforms",
            200
        )
        
        if success and isinstance(response, list):
            # Check if all 5 platforms are present
            platform_ids = [p.get('id') for p in response]
            expected_platforms = ['instagram', 'facebook', 'linkedin', 'tiktok', 'pinterest']
            all_present = all(platform in platform_ids for platform in expected_platforms)
            
            if all_present:
                print(f"   ✅ All 5 platforms present: {platform_ids}")
                # Check if all are configured
                configured_count = sum(1 for p in response if p.get('configured', False))
                print(f"   📊 Configured platforms: {configured_count}/5")
                return True
            else:
                print(f"   ❌ Missing platforms. Found: {platform_ids}")
                return False
        
        return success

    def test_social_profiles(self):
        """Test social profiles endpoints"""
        # Get profiles list
        success1, _ = self.run_test(
            "Get Social Profiles",
            "GET",
            "social/profiles",
            200
        )
        
        # Create manual profile
        success2, response2 = self.run_test(
            "Create Manual Social Profile",
            "POST",
            "social/profiles",
            200,
            data={
                "platform": "instagram",
                "profile_name": "@test_profile_manual",
                "connection_mode": "manual"
            }
        )
        
        if success2 and 'id' in response2:
            self.social_profile_id = response2['id']
            print(f"   Social Profile ID: {self.social_profile_id}")
        
        return success1 and success2

    def test_content_operations(self):
        """Test content CRUD operations"""
        if not hasattr(self, 'project_id'):
            print("❌ Skipping content operations - No project ID available")
            return False
            
        # Get contents
        success1, _ = self.run_test(
            "Get Contents",
            "GET",
            f"contents/{self.project_id}",
            200
        )
        
        # Update content (if we have content_id)
        success2 = True
        if hasattr(self, 'content_id'):
            success2, _ = self.run_test(
                "Update Content",
                "PUT",
                f"contents/{self.content_id}",
                200,
                data={
                    "script": "Updated test script",
                    "caption": "Updated test caption",
                    "hashtags": "#test #updated"
                }
            )
        
        return success1 and success2

    def test_delete_content(self):
        """Test content deletion"""
        if hasattr(self, 'content_id'):
            return self.run_test(
                "Delete Content",
                "DELETE",
                f"contents/{self.content_id}",
                200
            )[0]
        else:
            print("❌ Skipping content deletion - No content ID available")
            return True  # Not a failure if no content to delete

def main():
    print("🚀 Starting Sketchario V4 API Tests")
    print("=" * 50)
    
    tester = SketcharioAPITester()
    
    # Test sequence
    tests = [
        ("Root API", tester.test_root_endpoint),
        ("Admin Login", tester.test_admin_login),
        ("Auth Me", tester.test_auth_me),
        ("Get Projects", tester.test_get_projects),
        ("Create Project", tester.test_create_project),
        ("Get Project", tester.test_get_project),
        ("Profile Endpoints", tester.test_profile_endpoints),
        ("AI Generation", tester.test_ai_generation_endpoints),
        ("Content Create Post", tester.test_content_create_post),
        ("Social Platforms", tester.test_social_platforms),
        ("Social Profiles", tester.test_social_profiles),
        ("Content Operations", tester.test_content_operations),
        ("Delete Content", tester.test_delete_content),
        ("User Registration", tester.test_register_new_user),
        ("Logout", tester.test_logout),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {e}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"❌ Failed tests: {', '.join(failed_tests)}")
        return 1
    else:
        print("✅ All tests passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())