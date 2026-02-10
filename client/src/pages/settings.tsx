import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { Settings as SettingsIcon, Palette, Bell, Database, Shield } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-settings-title">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your application preferences
        </p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={toggleTheme}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Notification preferences coming soon</p>
              <p className="text-xs mt-1">
                Configure email and push notifications for reminders
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Data Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Database className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Export and backup options coming soon</p>
              <p className="text-xs mt-1">
                Export your pet data and health records as PDF
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Privacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Shield className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Privacy settings coming soon</p>
              <p className="text-xs mt-1">
                Manage data sharing and account preferences
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
