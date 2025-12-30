"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";

type AccountSettingsProps = {
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function AccountSettings({ user }: AccountSettingsProps) {
  const router = useRouter();
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(user.name);
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameError, setNameError] = useState("");

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      setNameError("名前を入力してください");
      return;
    }

    setIsUpdatingName(true);
    setNameError("");

    try {
      const result = await authClient.updateUser({
        name: name.trim(),
      });

      if (result.error) {
        setNameError(result.error.message || "更新に失敗しました");
        return;
      }

      setIsEditingName(false);
      toast.success("ユーザー名を更新しました");
      router.refresh();
    } catch {
      setNameError("更新に失敗しました");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleCancelEditName = () => {
    setName(user.name);
    setIsEditingName(false);
    setNameError("");
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess(false);

    if (!currentPassword) {
      setPasswordError("現在のパスワードを入力してください");
      return;
    }

    if (!newPassword) {
      setPasswordError("新しいパスワードを入力してください");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("パスワードは8文字以上で入力してください");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("新しいパスワードが一致しません");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
      });

      if (result.error) {
        setPasswordError(result.error.message || "パスワードの変更に失敗しました");
        return;
      }

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("パスワードを変更しました");

      setTimeout(() => {
        setIsPasswordDialogOpen(false);
        setPasswordSuccess(false);
      }, 1500);
    } catch {
      setPasswordError("パスワードの変更に失敗しました");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleClosePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setPasswordSuccess(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>アカウント情報</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ユーザー名 */}
        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">ユーザー名</Label>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdatingName}
                className="flex-1"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handleUpdateName}
                disabled={isUpdatingName}
              >
                {isUpdatingName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleCancelEditName}
                disabled={isUpdatingName}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="font-medium">{user.name}</p>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsEditingName(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          )}
          {nameError && (
            <p className="text-sm text-destructive">{nameError}</p>
          )}
        </div>

        {/* メールアドレス */}
        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">メールアドレス</Label>
          <p className="font-medium">{user.email}</p>
        </div>

        {/* パスワード変更 */}
        <div className="space-y-1">
          <Label className="text-sm text-muted-foreground">パスワード</Label>
          <div className="flex items-center justify-between">
            <p className="font-medium">••••••••</p>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Pencil className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>パスワードを変更</DialogTitle>
                  <DialogDescription>
                    新しいパスワードを設定してください
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {passwordError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="rounded-md bg-green-100 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      パスワードを変更しました
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">現在のパスワード</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isUpdatingPassword || passwordSuccess}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新しいパスワード</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isUpdatingPassword || passwordSuccess}
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">8文字以上</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">新しいパスワード（確認）</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isUpdatingPassword || passwordSuccess}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={handleClosePasswordDialog}
                    disabled={isUpdatingPassword}
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isUpdatingPassword || passwordSuccess}
                  >
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        変更中...
                      </>
                    ) : (
                      "変更する"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
