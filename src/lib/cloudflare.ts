// API Client that calls same-origin /api endpoints
class ApiClient {
  async createUser(userData: { email: string; username: string }): Promise<any> {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return res.json();
  }

  async getUserByUsername(username: string): Promise<any> {
    const res = await fetch(`/api/users/${username}`);
    return res.json();
  }

  async createLink(linkData: any): Promise<any> {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(linkData),
    });
    return res.json();
  }

  async getLinksByUserId(userId: string): Promise<any[]> {
    const res = await fetch(`/api/links?user_id=${userId}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }

  async getLinkById(id: string): Promise<any> {
    const res = await fetch(`/api/links/${id}`);
    return res.json();
  }

  async updateLink(id: string, data: any): Promise<any> {
    const res = await fetch(`/api/links/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async deleteLink(id: string): Promise<any> {
    const res = await fetch(`/api/links/${id}`, {
      method: 'DELETE',
    });
    return res.json();
  }

  async getLinkByUserAndSlug(userId: string, slug: string): Promise<any> {
    const res = await fetch(`/api/links/${userId}/${slug}`);
    return res.json();
  }

  async createClickEvent(eventData: any): Promise<any> {
    const res = await fetch('/api/click-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });
    return res.json();
  }

  async getClickEventsByLinkIds(linkIds: string[]): Promise<any[]> {
    const res = await fetch('/api/click-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ link_ids: linkIds }),
    });
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }
}

// Link type export for TypeScript
export interface Link {
  id: string;
  user_id: string;
  slug: string;
  original_url: string;
  title?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// User type export for TypeScript
export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// Extend ApiClient with magic link methods
class ApiClientWithMagicLink extends ApiClient {
  async sendMagicLink(email: string): Promise<{ error?: string; magicLink?: string; user?: User }> {
    const res = await fetch('/api/auth/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return res.json();
  }

  async verifyMagicLink(token: string): Promise<{ error?: string; token?: string; user?: User }> {
    const res = await fetch(`/api/auth/verify?token=${token}`);
    return res.json();
  }
}

// Export the API client with magic link support
export const db = new ApiClientWithMagicLink();
