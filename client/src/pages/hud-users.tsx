import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  UserPlus,
  Mail,
  Shield,
  Pencil,
  Trash2,
  Users,
  Loader2,
  FolderPlus,
  UserMinus,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GroupInfo {
  id: string;
  name: string;
  description: string | null;
}

interface TeamMember {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  groups: GroupInfo[];
}

interface GroupWithCount {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
}

interface GroupFeatureItem {
  featureId: string;
  featureName: string;
  featureSlug: string;
  enabledGlobally: boolean;
  enabled: boolean;
  hasOverride: boolean;
}

const addMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["OWNER", "MEMBER"]),
});

const editMemberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  role: z.enum(["OWNER", "MEMBER"]),
});

const groupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
});

type AddMemberData = z.infer<typeof addMemberSchema>;
type EditMemberData = z.infer<typeof editMemberSchema>;
type GroupFormData = z.infer<typeof groupSchema>;

function UsersTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [assignGroupUser, setAssignGroupUser] = useState<TeamMember | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/hud/users"],
  });

  const { data: allGroups } = useQuery<GroupWithCount[]>({
    queryKey: ["/api/hud/groups"],
  });

  const addForm = useForm<AddMemberData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { name: "", email: "", password: "", role: "MEMBER" },
  });

  const editForm = useForm<EditMemberData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: { name: "", email: "", role: "MEMBER" },
  });

  const addMutation = useMutation({
    mutationFn: async (data: AddMemberData) => {
      const res = await apiRequest("POST", "/api/admin/team", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      setShowAddDialog(false);
      addForm.reset();
      toast({ title: "Team member added" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to add member", description: msg, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditMemberData }) => {
      const res = await apiRequest("PATCH", `/api/admin/team/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      setEditingMember(null);
      toast({ title: "Team member updated" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to update member", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/team/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      setDeletingMember(null);
      toast({ title: "Team member removed" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to remove member", description: msg, variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/hud/users/${id}/active`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      toast({ title: "User status updated" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to update status", description: msg, variant: "destructive" });
    },
  });

  const assignGroupMutation = useMutation({
    mutationFn: async ({ userId, groupId }: { userId: string; groupId: string }) => {
      const res = await apiRequest("POST", `/api/hud/users/${userId}/groups`, { groupId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups"] });
      setAssignGroupUser(null);
      setSelectedGroupId("");
      toast({ title: "User added to group" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to assign group", description: msg, variant: "destructive" });
    },
  });

  const removeGroupMutation = useMutation({
    mutationFn: async ({ userId, groupId }: { userId: string; groupId: string }) => {
      await apiRequest("DELETE", `/api/hud/users/${userId}/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups"] });
      toast({ title: "User removed from group" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to remove from group", description: msg, variant: "destructive" });
    },
  });

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    editForm.reset({ name: member.name, email: member.email, role: member.role as "OWNER" | "MEMBER" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-users-subtitle">All Users</h2>
          <p className="text-muted-foreground text-sm">Manage user accounts, roles, and group assignments</p>
        </div>
        <Button onClick={() => { addForm.reset(); setShowAddDialog(true); }} data-testid="button-add-member">
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : members && members.length > 0 ? (
        <div className="space-y-3">
          {members.map((member) => (
            <Card key={member.id} data-testid={`card-user-${member.id}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate" data-testid={`text-user-name-${member.id}`}>
                        {member.name}
                      </p>
                      <Badge
                        variant={member.role === "OWNER" ? "default" : "secondary"}
                        className="text-[11px] flex-shrink-0"
                        data-testid={`badge-user-role-${member.id}`}
                      >
                        {member.role === "OWNER" ? (
                          <><Shield className="h-3 w-3 mr-1" />Owner</>
                        ) : (
                          "Member"
                        )}
                      </Badge>
                      {!member.isActive && (
                        <Badge variant="outline" className="text-[11px] flex-shrink-0 text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                      {member.id === user?.id && (
                        <Badge variant="outline" className="text-[11px] flex-shrink-0">You</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate" data-testid={`text-user-email-${member.id}`}>
                        {member.email}
                      </span>
                    </div>
                    {member.groups && member.groups.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {member.groups.map((g) => (
                          <Badge
                            key={g.id}
                            variant="outline"
                            className="text-[10px] flex-shrink-0"
                            data-testid={`badge-user-group-${member.id}-${g.id}`}
                          >
                            {g.name}
                            {member.id !== user?.id && (
                              <button
                                className="ml-1 hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGroupMutation.mutate({ userId: member.id, groupId: g.id });
                                }}
                                data-testid={`button-remove-group-${member.id}-${g.id}`}
                              >
                                <UserMinus className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {member.id !== user?.id && (
                      <div className="flex items-center gap-1.5" data-testid={`switch-active-${member.id}`}>
                        <span className="text-xs text-muted-foreground">Active</span>
                        <Switch
                          checked={member.isActive}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: member.id, isActive: checked })
                          }
                        />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setAssignGroupUser(member)}
                      data-testid={`button-assign-group-${member.id}`}
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(member)}
                      data-testid={`button-edit-user-${member.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    {member.id !== user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingMember(member)}
                        data-testid={`button-delete-user-${member.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No users yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add users to your organization</p>
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent data-testid="dialog-add-user">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
            <DialogDescription>
              Create a new account for a team member.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Smith" data-testid="input-add-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" data-testid="input-add-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="At least 6 characters" data-testid="input-add-password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-add-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="OWNER">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending} data-testid="button-submit-add-user">
                  {addMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add User
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent data-testid="dialog-edit-user">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update this user's information.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((data) =>
                editingMember && editMutation.mutate({ id: editingMember.id, data })
              )}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-edit-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" data-testid="input-edit-email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MEMBER">Member</SelectItem>
                        <SelectItem value="OWNER">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingMember(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-submit-edit-user">
                  {editMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignGroupUser} onOpenChange={(open) => { if (!open) { setAssignGroupUser(null); setSelectedGroupId(""); } }}>
        <DialogContent data-testid="dialog-assign-group">
          <DialogHeader>
            <DialogTitle>Assign to Group</DialogTitle>
            <DialogDescription>
              Add {assignGroupUser?.name} to a group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {allGroups && allGroups.length > 0 ? (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger data-testid="select-assign-group">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {allGroups
                    .filter((g) => !assignGroupUser?.groups?.some((ug) => ug.id === g.id))
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No groups available. Create a group first.</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { setAssignGroupUser(null); setSelectedGroupId(""); }}>
              Cancel
            </Button>
            <Button
              disabled={!selectedGroupId || assignGroupMutation.isPending}
              onClick={() => assignGroupUser && selectedGroupId && assignGroupMutation.mutate({ userId: assignGroupUser.id, groupId: selectedGroupId })}
              data-testid="button-submit-assign-group"
            >
              {assignGroupMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add to Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingMember} onOpenChange={(open) => !open && setDeletingMember(null)}>
        <AlertDialogContent data-testid="dialog-delete-user">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deletingMember?.name}</strong>?
              Their data will remain but they will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-user">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingMember && deleteMutation.mutate(deletingMember.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-user"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GroupDetailView({ group, onBack }: { group: GroupWithCount; onBack: () => void }) {
  const { toast } = useToast();

  const { data: members, isLoading: membersLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/hud/groups", group.id, "members"],
  });

  const { data: featurePerms, isLoading: featuresLoading } = useQuery<GroupFeatureItem[]>({
    queryKey: ["/api/hud/groups", group.id, "features"],
  });

  const { data: allUsers } = useQuery<TeamMember[]>({
    queryKey: ["/api/hud/users"],
  });

  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("POST", `/api/hud/groups/${group.id}/members`, { userId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups", group.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      setSelectedUserId("");
      toast({ title: "Member added to group" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to add member", description: msg, variant: "destructive" });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/hud/groups/${group.id}/members`, { userId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups", group.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      toast({ title: "Member removed from group" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to remove member", description: msg, variant: "destructive" });
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ featureId, enabled }: { featureId: string; enabled: boolean }) => {
      await apiRequest("PATCH", `/api/hud/groups/${group.id}/features`, { featureId, enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups", group.id, "features"] });
      toast({ title: "Feature permission updated" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to update permission", description: msg, variant: "destructive" });
    },
  });

  const memberIds = members?.map((m) => m.id) ?? [];
  const availableUsers = allUsers?.filter((u) => !memberIds.includes(u.id)) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-groups">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-group-detail-name">{group.name}</h2>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <CardTitle className="text-base">Members</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            {availableUsers.length > 0 && (
              <>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-[180px]" data-testid="select-group-add-member">
                    <SelectValue placeholder="Add member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  disabled={!selectedUserId || addMemberMutation.isPending}
                  onClick={() => selectedUserId && addMemberMutation.mutate(selectedUserId)}
                  data-testid="button-group-add-member"
                >
                  {addMemberMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {membersLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : members && members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 py-2" data-testid={`row-group-member-${member.id}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => removeMemberMutation.mutate(member.id)}
                    disabled={removeMemberMutation.isPending}
                    data-testid={`button-remove-group-member-${member.id}`}
                  >
                    <UserMinus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No members in this group</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Feature Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {featuresLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : featurePerms && featurePerms.length > 0 ? (
            <div className="space-y-3">
              {featurePerms.map((fp) => (
                <div key={fp.featureId} className="flex items-center justify-between gap-3" data-testid={`row-feature-perm-${fp.featureSlug}`}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{fp.featureName}</p>
                    {fp.enabledGlobally && (
                      <p className="text-xs text-muted-foreground">Enabled globally</p>
                    )}
                  </div>
                  <Switch
                    checked={fp.enabled}
                    onCheckedChange={(checked) =>
                      toggleFeatureMutation.mutate({ featureId: fp.featureId, enabled: checked })
                    }
                    disabled={toggleFeatureMutation.isPending}
                    data-testid={`switch-feature-${fp.featureSlug}`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No features available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function GroupsTab() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<GroupWithCount | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<GroupWithCount | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithCount | null>(null);

  const { data: groupsList, isLoading } = useQuery<GroupWithCount[]>({
    queryKey: ["/api/hud/groups"],
  });

  const createForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", description: "" },
  });

  const editForm = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GroupFormData) => {
      const res = await apiRequest("POST", "/api/hud/groups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups"] });
      setShowCreateDialog(false);
      createForm.reset();
      toast({ title: "Group created" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to create group", description: msg, variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: GroupFormData }) => {
      const res = await apiRequest("PATCH", `/api/hud/groups/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups"] });
      setEditingGroup(null);
      toast({ title: "Group updated" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to update group", description: msg, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/hud/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hud/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hud/users"] });
      setDeletingGroup(null);
      toast({ title: "Group deleted" });
    },
    onError: (e: any) => {
      const msg = e.message?.includes(":") ? e.message.split(":").slice(1).join(":").trim() : e.message;
      toast({ title: "Failed to delete group", description: msg, variant: "destructive" });
    },
  });

  const openEditDialog = (group: GroupWithCount) => {
    setEditingGroup(group);
    editForm.reset({ name: group.name, description: group.description || "" });
  };

  if (selectedGroup) {
    return <GroupDetailView group={selectedGroup} onBack={() => setSelectedGroup(null)} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold" data-testid="text-groups-subtitle">Groups</h2>
          <p className="text-muted-foreground text-sm">Organize users and manage feature permissions by group</p>
        </div>
        <Button onClick={() => { createForm.reset(); setShowCreateDialog(true); }} data-testid="button-create-group">
          <FolderPlus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupsList && groupsList.length > 0 ? (
        <div className="space-y-3">
          {groupsList.map((group) => (
            <Card
              key={group.id}
              className="hover-elevate cursor-pointer"
              onClick={() => setSelectedGroup(group)}
              data-testid={`card-group-${group.id}`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-group-name-${group.id}`}>
                        {group.name}
                      </p>
                      {group.description && (
                        <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5" data-testid={`text-group-count-${group.id}`}>
                        {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); openEditDialog(group); }}
                      data-testid={`button-edit-group-${group.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); setDeletingGroup(group); }}
                      data-testid={`button-delete-group-${group.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); setSelectedGroup(group); }}
                      data-testid={`button-manage-group-${group.id}`}
                    >
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">No groups yet</p>
          <p className="text-xs text-muted-foreground mt-1">Create groups to organize users and manage permissions</p>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent data-testid="dialog-create-group">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>Create a new group to organize users and manage permissions.</DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Sales Team" data-testid="input-group-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description" data-testid="input-group-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-create-group">
                  {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Group
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
        <DialogContent data-testid="dialog-edit-group">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update this group's information.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((data) =>
                editingGroup && editMutation.mutate({ id: editingGroup.id, data })
              )}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input data-testid="input-edit-group-name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea data-testid="input-edit-group-description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingGroup(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-submit-edit-group">
                  {editMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingGroup} onOpenChange={(open) => !open && setDeletingGroup(null)}>
        <AlertDialogContent data-testid="dialog-delete-group">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingGroup?.name}</strong>?
              Members will be removed from this group but their accounts will remain.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-group">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingGroup && deleteMutation.mutate(deletingGroup.id)}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete-group"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function HudUsers() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-users-title">
          Users & Groups
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage user accounts, groups, and feature permissions
        </p>
      </div>
      <Tabs defaultValue="users" className="space-y-6">
        <TabsList data-testid="tabs-users-groups">
          <TabsTrigger value="users" data-testid="tab-users">Users</TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
        <TabsContent value="groups">
          <GroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
