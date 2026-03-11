import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Share2, Plus, Trash2, Edit2, Send, Calendar, Clock, Loader2, CheckCircle2, XCircle,
  AlertCircle, ChevronDown, ChevronRight, ExternalLink, Twitter, Facebook, Linkedin, Instagram
} from "lucide-react";
import { format } from "date-fns";
import type { SocialAccount, SocialPost, SocialPostPlatform } from "@shared/schema";

type PostWithPlatforms = SocialPost & { platforms: SocialPostPlatform[] };

const PLATFORM_CONFIG: Record<string, { label: string; icon: any; color: string; fields: { key: string; label: string; required: boolean; type?: string }[]; guide: { steps: string[]; link: string; linkLabel: string } }> = {
  twitter: {
    label: "X (Twitter)",
    icon: Twitter,
    color: "text-sky-500",
    fields: [
      { key: "apiKey", label: "API Key (Consumer Key)", required: true },
      { key: "apiSecret", label: "API Secret (Consumer Secret)", required: true },
      { key: "accessToken", label: "Access Token", required: true },
      { key: "accessTokenSecret", label: "Access Token Secret", required: true },
    ],
    guide: {
      steps: [
        "Go to developer.twitter.com and sign in",
        "Create a new Project, then create an App inside it",
        "Under 'Keys and Tokens', generate your API Key and API Secret",
        "Generate your Access Token and Access Token Secret",
        "Set app permissions to 'Read and Write'",
      ],
      link: "https://developer.twitter.com/en/portal/dashboard",
      linkLabel: "Open Twitter Developer Portal",
    },
  },
  facebook: {
    label: "Facebook",
    icon: Facebook,
    color: "text-blue-600",
    fields: [
      { key: "accessToken", label: "Page Access Token", required: true },
      { key: "pageId", label: "Page ID", required: true },
    ],
    guide: {
      steps: [
        "Go to developers.facebook.com and create a new App",
        "Add the 'Pages' product to your app",
        "Go to Graph API Explorer and select your app",
        "Request 'pages_manage_posts' and 'pages_read_engagement' permissions",
        "Generate a long-lived Page Access Token",
        "Copy your Page ID from your Facebook page's About section",
      ],
      link: "https://developers.facebook.com/apps/",
      linkLabel: "Open Facebook Developer Portal",
    },
  },
  linkedin: {
    label: "LinkedIn",
    icon: Linkedin,
    color: "text-blue-700",
    fields: [
      { key: "accessToken", label: "Access Token", required: true },
    ],
    guide: {
      steps: [
        "Go to linkedin.com/developers and create a new App",
        "Request access to 'Share on LinkedIn' and 'Sign In with LinkedIn'",
        "Under Auth tab, add redirect URL and generate an access token",
        "Use OAuth 2.0 to get a long-lived access token",
      ],
      link: "https://www.linkedin.com/developers/apps",
      linkLabel: "Open LinkedIn Developer Portal",
    },
  },
  instagram: {
    label: "Instagram",
    icon: Instagram,
    color: "text-pink-500",
    fields: [
      { key: "accessToken", label: "Access Token", required: true },
      { key: "pageId", label: "Instagram Business Account ID", required: true },
    ],
    guide: {
      steps: [
        "Convert your Instagram account to a Business or Creator account",
        "Connect it to a Facebook Page",
        "Go to developers.facebook.com and create an App",
        "Add 'Instagram Graph API' product",
        "Generate a long-lived access token with 'instagram_basic' and 'instagram_content_publish' permissions",
        "Get your Instagram Business Account ID from the API",
      ],
      link: "https://developers.facebook.com/apps/",
      linkLabel: "Open Facebook/Instagram Developer Portal",
    },
  },
};

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const config = PLATFORM_CONFIG[platform];
  if (!config) return null;
  const Icon = config.icon;
  return <Icon className={`${config.color} ${className || "h-4 w-4"}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PUBLISHING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  return <Badge className={variants[status] || ""} data-testid={`badge-status-${status.toLowerCase()}`}>{status}</Badge>;
}

export default function HudSocial() {
  const [activeTab, setActiveTab] = useState("posts");
  const { toast } = useToast();

  const { data: accounts, isLoading: loadingAccounts } = useQuery<SocialAccount[]>({
    queryKey: ["/api/admin/social-accounts"],
  });

  const { data: posts, isLoading: loadingPosts } = useQuery<PostWithPlatforms[]>({
    queryKey: ["/api/admin/social-posts"],
  });

  const totalPosts = posts?.length || 0;
  const scheduledPosts = posts?.filter(p => p.status === "SCHEDULED").length || 0;
  const publishedPosts = posts?.filter(p => p.status === "PUBLISHED").length || 0;
  const failedPosts = posts?.filter(p => p.status === "FAILED").length || 0;
  const connectedAccounts = accounts?.filter(a => a.status === "ACTIVE").length || 0;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-social-title">Social Media</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Plan, schedule, and publish across platforms
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card data-testid="card-stat-total-posts">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground">Total Posts</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{totalPosts}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-scheduled">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scheduledPosts}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-published">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground">Published</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{publishedPosts}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-failed">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{failedPosts}</p>
          </CardContent>
        </Card>
        <Card data-testid="card-stat-accounts">
          <CardContent className="pt-4 pb-3 px-4">
            <p className="text-xs font-medium text-muted-foreground">Accounts</p>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{connectedAccounts}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="tabs-social">
          <TabsTrigger value="posts" data-testid="tab-posts">Posts</TabsTrigger>
          <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar</TabsTrigger>
          <TabsTrigger value="accounts" data-testid="tab-accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <PostsTab accounts={accounts || []} posts={posts || []} loading={loadingPosts} toast={toast} />
        </TabsContent>
        <TabsContent value="calendar">
          <CalendarTab posts={posts || []} />
        </TabsContent>
        <TabsContent value="accounts">
          <AccountsTab accounts={accounts || []} loading={loadingAccounts} toast={toast} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PostsTab({ accounts, posts, loading, toast }: { accounts: SocialAccount[]; posts: PostWithPlatforms[]; loading: boolean; toast: any }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState<PostWithPlatforms | null>(null);
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const activeAccounts = accounts.filter(a => a.status === "ACTIVE");

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/social-posts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-posts"] });
      setCreateOpen(false);
      resetForm();
      toast({ title: "Post created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/social-posts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-posts"] });
      setEditPost(null);
      resetForm();
      toast({ title: "Post updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/social-posts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-posts"] });
      toast({ title: "Post deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/social-posts/${id}/publish`);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-posts"] });
      const failed = data.publishResults?.filter((r: any) => !r.success) || [];
      if (failed.length > 0) {
        toast({ title: "Partially published", description: `${failed.length} platform(s) failed`, variant: "destructive" });
      } else {
        toast({ title: "Published successfully" });
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function resetForm() {
    setContent("");
    setMediaUrl("");
    setScheduledAt("");
    setSelectedAccounts([]);
  }

  function openEdit(post: PostWithPlatforms) {
    setEditPost(post);
    setContent(post.content);
    setMediaUrl(post.mediaUrl || "");
    setScheduledAt(post.scheduledAt ? format(new Date(post.scheduledAt), "yyyy-MM-dd'T'HH:mm") : "");
    setSelectedAccounts(post.platforms.map(p => p.socialAccountId));
  }

  function handleCreate(publish: boolean) {
    const data: any = {
      content,
      mediaUrl: mediaUrl || null,
      platformAccountIds: selectedAccounts,
      status: publish ? "DRAFT" : scheduledAt ? "SCHEDULED" : "DRAFT",
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };
    createMutation.mutate(data, {
      onSuccess: (newPost: any) => {
        if (publish && newPost?.id) {
          publishMutation.mutate(newPost.id);
        }
      },
    });
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  const postForm = (
    <div className="space-y-4">
      <div>
        <Label>Content</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What do you want to share?"
          className="min-h-[120px] mt-1"
          data-testid="input-post-content"
        />
        <p className="text-xs text-muted-foreground mt-1">{content.length} characters</p>
      </div>
      <div>
        <Label>Media URL (optional)</Label>
        <Input
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mt-1"
          data-testid="input-media-url"
        />
      </div>
      <div>
        <Label>Schedule (optional)</Label>
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="mt-1"
          data-testid="input-schedule"
        />
      </div>
      <div>
        <Label>Platforms</Label>
        {activeAccounts.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-1">No connected accounts. Add accounts in the Accounts tab.</p>
        ) : (
          <div className="space-y-2 mt-2">
            {activeAccounts.map(account => (
              <div key={account.id} className="flex items-center gap-2">
                <Checkbox
                  checked={selectedAccounts.includes(account.id)}
                  onCheckedChange={(checked) => {
                    setSelectedAccounts(prev =>
                      checked ? [...prev, account.id] : prev.filter(id => id !== account.id)
                    );
                  }}
                  data-testid={`checkbox-account-${account.id}`}
                />
                <PlatformIcon platform={account.platform} />
                <span className="text-sm">{account.accountName}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700" data-testid="button-create-post">
              <Plus className="h-4 w-4 mr-2" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Post</DialogTitle>
            </DialogHeader>
            {postForm}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => handleCreate(false)}
                disabled={!content || selectedAccounts.length === 0 || createMutation.isPending}
                data-testid="button-save-draft"
              >
                {scheduledAt ? "Schedule" : "Save Draft"}
              </Button>
              <Button
                className="bg-rose-600 hover:bg-rose-700"
                onClick={() => handleCreate(true)}
                disabled={!content || selectedAccounts.length === 0 || createMutation.isPending || publishMutation.isPending}
                data-testid="button-post-now"
              >
                {(createMutation.isPending || publishMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Send className="h-4 w-4 mr-2" /> Post Now
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={!!editPost} onOpenChange={(o) => { if (!o) { setEditPost(null); resetForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          {postForm}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => editPost && updateMutation.mutate({ id: editPost.id, data: { content, mediaUrl: mediaUrl || null, scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null, status: scheduledAt ? "SCHEDULED" : "DRAFT" } })}
              disabled={!content || updateMutation.isPending}
              data-testid="button-update-post"
            >
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Share2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium">No posts yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first social media post</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card key={post.id} data-testid={`card-post-${post.id}`}>
              <CardContent className="py-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={post.status} />
                      <div className="flex gap-1">
                        {post.platforms.map(pp => (
                          <PlatformIcon key={pp.id} platform={pp.platform} />
                        ))}
                      </div>
                      {post.scheduledAt && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(post.scheduledAt), "MMM d, yyyy h:mm a")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{post.content.length > 200 ? post.content.slice(0, 200) + "..." : post.content}</p>
                    {post.platforms.some(pp => pp.error) && (
                      <div className="mt-2 space-y-1">
                        {post.platforms.filter(pp => pp.error).map(pp => (
                          <p key={pp.id} className="text-xs text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {PLATFORM_CONFIG[pp.platform]?.label}: {pp.error}
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {format(new Date(post.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {(post.status === "DRAFT" || post.status === "FAILED") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => publishMutation.mutate(post.id)}
                        disabled={publishMutation.isPending}
                        data-testid={`button-publish-${post.id}`}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                    {(post.status === "DRAFT" || post.status === "SCHEDULED") && (
                      <Button size="sm" variant="ghost" onClick={() => openEdit(post)} data-testid={`button-edit-${post.id}`}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteMutation.mutate(post.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-${post.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarTab({ posts }: { posts: PostWithPlatforms[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const postsByDay: Record<number, PostWithPlatforms[]> = {};
  posts.forEach(post => {
    const date = post.scheduledAt ? new Date(post.scheduledAt) : new Date(post.createdAt);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (!postsByDay[day]) postsByDay[day] = [];
      postsByDay[day].push(post);
    }
  });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-400",
    SCHEDULED: "bg-blue-500",
    PUBLISHING: "bg-yellow-500",
    PUBLISHED: "bg-green-500",
    FAILED: "bg-red-500",
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={prevMonth} data-testid="button-prev-month">&larr;</Button>
          <CardTitle className="text-lg" data-testid="text-calendar-month">
            {format(currentDate, "MMMM yyyy")}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={nextMonth} data-testid="button-next-month">&rarr;</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="text-xs font-medium text-muted-foreground text-center py-2">{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-20" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayPosts = postsByDay[day] || [];
            return (
              <div
                key={day}
                className="h-20 border border-border/50 rounded-sm p-1 text-xs"
                data-testid={`calendar-day-${day}`}
              >
                <span className="font-medium">{day}</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {dayPosts.slice(0, 3).map(post => (
                    <div
                      key={post.id}
                      className={`w-2 h-2 rounded-full ${statusColors[post.status] || "bg-gray-400"}`}
                      title={`${post.status}: ${post.content.slice(0, 50)}`}
                    />
                  ))}
                  {dayPosts.length > 3 && (
                    <span className="text-muted-foreground">+{dayPosts.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountsTab({ accounts, loading, toast }: { accounts: SocialAccount[]; loading: boolean; toast: any }) {
  const [addPlatform, setAddPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [openGuides, setOpenGuides] = useState<Record<string, boolean>>({});

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/social-accounts", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-accounts"] });
      setAddPlatform(null);
      setFormData({});
      toast({ title: "Account connected" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/social-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/social-accounts"] });
      toast({ title: "Account removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const testMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/social-accounts/${id}/test`);
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        toast({ title: "Connection successful" });
      } else {
        toast({ title: "Connection failed", description: data.error, variant: "destructive" });
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function handleSave(platform: string) {
    const config = PLATFORM_CONFIG[platform];
    if (!config) return;
    const accountName = formData.accountName || "";
    if (!accountName) {
      toast({ title: "Account name required", variant: "destructive" });
      return;
    }
    for (const field of config.fields) {
      if (field.required && !formData[field.key]) {
        toast({ title: `${field.label} is required`, variant: "destructive" });
        return;
      }
    }
    createMutation.mutate({
      platform,
      accountName,
      accessToken: formData.accessToken || "",
      accessTokenSecret: formData.accessTokenSecret || null,
      apiKey: formData.apiKey || null,
      apiSecret: formData.apiSecret || null,
      pageId: formData.pageId || null,
    });
  }

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => {
          const existing = accounts.filter(a => a.platform === platform);
          const Icon = config.icon;

          return (
            <Card key={platform} data-testid={`card-platform-${platform}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${config.color}`} />
                    <CardTitle className="text-base">{config.label}</CardTitle>
                  </div>
                  {existing.length > 0 ? (
                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not connected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {existing.map(account => (
                  <div key={account.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                    <div>
                      <p className="text-sm font-medium">{account.accountName}</p>
                      <p className="text-xs text-muted-foreground">{account.status}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testMutation.mutate(account.id)}
                        disabled={testMutation.isPending}
                        data-testid={`button-test-${account.id}`}
                      >
                        {testMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500"
                        onClick={() => deleteMutation.mutate(account.id)}
                        data-testid={`button-remove-${account.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Collapsible open={openGuides[platform]} onOpenChange={(o) => setOpenGuides(prev => ({ ...prev, [platform]: o }))}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground" data-testid={`button-guide-${platform}`}>
                      {openGuides[platform] ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                      Setup Guide
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-3 bg-muted/30 rounded text-sm space-y-2">
                      <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                        {config.guide.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ol>
                      <a
                        href={config.guide.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 text-xs"
                        data-testid={`link-guide-${platform}`}
                      >
                        <ExternalLink className="h-3 w-3" /> {config.guide.linkLabel}
                      </a>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {addPlatform === platform ? (
                  <div className="space-y-3 p-3 border rounded">
                    <div>
                      <Label className="text-xs">Account Name</Label>
                      <Input
                        value={formData.accountName || ""}
                        onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                        placeholder="My Account"
                        className="mt-1 h-8 text-sm"
                        data-testid={`input-account-name-${platform}`}
                      />
                    </div>
                    {config.fields.map(field => (
                      <div key={field.key}>
                        <Label className="text-xs">{field.label}{field.required && " *"}</Label>
                        <Input
                          type="password"
                          value={formData[field.key] || ""}
                          onChange={(e) => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          placeholder={field.label}
                          className="mt-1 h-8 text-sm"
                          data-testid={`input-${field.key}-${platform}`}
                        />
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-rose-600 hover:bg-rose-700"
                        onClick={() => handleSave(platform)}
                        disabled={createMutation.isPending}
                        data-testid={`button-save-${platform}`}
                      >
                        {createMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setAddPlatform(null); setFormData({}); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => { setAddPlatform(platform); setFormData({}); }}
                    data-testid={`button-add-${platform}`}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Add Account
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
