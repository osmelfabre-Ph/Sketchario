"""
Sketchario V4 Backend Tests - Mobile Responsiveness & Feed Strips
Tests for:
- AI Feed Suggestions API
- RSS Feed API
- Authentication
- Project CRUD
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://editorial-flow-v4.preview.emergentagent.com')

# Test credentials
ADMIN_EMAIL = "admin@sketchario.app"
ADMIN_PASSWORD = "Sketchario2026!"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test successful admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == ADMIN_EMAIL
        print(f"✓ Login successful for {ADMIN_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected")
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        token = login_resp.json()["access_token"]
        
        # Then check /auth/me
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200, f"Auth/me failed: {response.text}"
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == ADMIN_EMAIL
        print("✓ Auth/me endpoint working")


class TestProjects:
    """Project CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_list_projects(self, auth_token):
        """Test listing projects"""
        response = requests.get(f"{BASE_URL}/api/projects", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200, f"List projects failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} projects")
    
    def test_get_project_detail(self, auth_token):
        """Test getting project details"""
        # First get list of projects
        list_resp = requests.get(f"{BASE_URL}/api/projects", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        projects = list_resp.json()
        
        if len(projects) > 0:
            project_id = projects[0]["id"]
            response = requests.get(f"{BASE_URL}/api/projects/{project_id}", headers={
                "Authorization": f"Bearer {auth_token}"
            })
            assert response.status_code == 200, f"Get project failed: {response.text}"
            data = response.json()
            assert "id" in data
            assert "name" in data
            assert "sector" in data
            print(f"✓ Got project detail: {data['name']}")
        else:
            pytest.skip("No projects available for testing")


class TestAIFeedSuggestions:
    """AI Feed Suggestions API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def project_id(self, auth_token):
        """Get first project ID"""
        response = requests.get(f"{BASE_URL}/api/projects", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        projects = response.json()
        if len(projects) > 0:
            return projects[0]["id"]
        pytest.skip("No projects available for testing")
    
    def test_get_ai_suggestions(self, auth_token, project_id):
        """Test POST /api/feeds/ai-suggestions/{project_id}"""
        response = requests.post(
            f"{BASE_URL}/api/feeds/ai-suggestions/{project_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"AI suggestions failed: {response.text}"
        data = response.json()
        
        # Should return a list of suggestions
        assert isinstance(data, list), "Response should be a list"
        assert len(data) <= 5, "Should return max 5 suggestions"
        
        if len(data) > 0:
            # Validate suggestion structure
            suggestion = data[0]
            assert "id" in suggestion, "Suggestion should have id"
            assert "title" in suggestion, "Suggestion should have title"
            assert "summary" in suggestion, "Suggestion should have summary"
            assert "format" in suggestion, "Suggestion should have format"
            assert suggestion["format"] in ["reel", "carousel"], f"Invalid format: {suggestion['format']}"
            assert "source" in suggestion and suggestion["source"] == "ai"
            print(f"✓ Got {len(data)} AI suggestions")
            print(f"  Sample: {suggestion['title'][:50]}...")
    
    def test_refresh_ai_suggestions(self, auth_token, project_id):
        """Test POST /api/feeds/ai-suggestions/{project_id}/refresh"""
        # First get initial suggestions
        initial_resp = requests.post(
            f"{BASE_URL}/api/feeds/ai-suggestions/{project_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        initial_data = initial_resp.json()
        
        # Wait a moment then refresh
        time.sleep(1)
        
        # Refresh suggestions
        response = requests.post(
            f"{BASE_URL}/api/feeds/ai-suggestions/{project_id}/refresh",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"AI refresh failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Refreshed AI suggestions, got {len(data)} new items")
        
        # Verify suggestions have trend_tag (new feature)
        if len(data) > 0:
            for suggestion in data:
                if "trend_tag" in suggestion:
                    print(f"  Trend tag found: {suggestion['trend_tag']}")
                    break


class TestRSSFeeds:
    """RSS Feed API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def project_id(self, auth_token):
        """Get first project ID"""
        response = requests.get(f"{BASE_URL}/api/projects", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        projects = response.json()
        if len(projects) > 0:
            return projects[0]["id"]
        pytest.skip("No projects available for testing")
    
    def test_list_feeds(self, auth_token, project_id):
        """Test GET /api/feeds/{project_id}"""
        response = requests.get(
            f"{BASE_URL}/api/feeds/{project_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"List feeds failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} feeds")
    
    def test_get_feed_items(self, auth_token, project_id):
        """Test GET /api/feeds/{project_id}/items"""
        response = requests.get(
            f"{BASE_URL}/api/feeds/{project_id}/items",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get feed items failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        
        if len(data) > 0:
            item = data[0]
            assert "id" in item, "Feed item should have id"
            assert "title" in item, "Feed item should have title"
            assert "feed_name" in item, "Feed item should have feed_name"
            print(f"✓ Got {len(data)} feed items")
            print(f"  Sample: {item['title'][:50]}...")
        else:
            print("✓ Feed items endpoint working (no items yet)")
    
    def test_refresh_feeds(self, auth_token, project_id):
        """Test POST /api/feeds/refresh/{project_id}"""
        response = requests.post(
            f"{BASE_URL}/api/feeds/refresh/{project_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Refresh feeds failed: {response.text}"
        data = response.json()
        assert "ok" in data and data["ok"] == True
        print(f"✓ Refreshed feeds, got {data.get('count', 0)} items")


class TestContents:
    """Content CRUD tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def project_id(self, auth_token):
        """Get first project ID"""
        response = requests.get(f"{BASE_URL}/api/projects", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        projects = response.json()
        if len(projects) > 0:
            return projects[0]["id"]
        pytest.skip("No projects available for testing")
    
    def test_list_contents(self, auth_token, project_id):
        """Test GET /api/contents/{project_id}"""
        response = requests.get(
            f"{BASE_URL}/api/contents/{project_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"List contents failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Listed {len(data)} contents")
    
    def test_create_post(self, auth_token, project_id):
        """Test POST /api/content/create-post"""
        response = requests.post(
            f"{BASE_URL}/api/content/create-post",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "project_id": project_id,
                "hook_text": "TEST_Mobile_Responsiveness_Test_Post",
                "format": "reel",
                "use_ai": False
            }
        )
        assert response.status_code == 200, f"Create post failed: {response.text}"
        data = response.json()
        assert "id" in data, "Created post should have id"
        assert data["hook_text"] == "TEST_Mobile_Responsiveness_Test_Post"
        print(f"✓ Created test post: {data['id']}")
        
        # Cleanup - delete the test post
        delete_resp = requests.delete(
            f"{BASE_URL}/api/contents/{data['id']}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert delete_resp.status_code == 200, "Failed to cleanup test post"
        print("✓ Cleaned up test post")


class TestPublishQueue:
    """Publish Queue tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def project_id(self, auth_token):
        """Get first project ID"""
        response = requests.get(f"{BASE_URL}/api/projects", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        projects = response.json()
        if len(projects) > 0:
            return projects[0]["id"]
        pytest.skip("No projects available for testing")
    
    def test_get_publish_queue(self, auth_token, project_id):
        """Test GET /api/publish/queue/{project_id}"""
        response = requests.get(
            f"{BASE_URL}/api/publish/queue/{project_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get queue failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Got publish queue with {len(data)} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
