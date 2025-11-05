import React from 'react';
import { Button } from '../components/ui';
import { Input } from '../components/ui';
import { Label } from '../components/ui';
import { Badge } from '../components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Skeleton } from '../components/ui';

export default function StyleGuide() {
  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-8">
      <h1 className="text-2xl font-bold">UI Style Guide</h1>

      <Card>
        <CardHeader>
          <CardTitle>Buttons</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inputs</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" placeholder="you@example.com" />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="pass">Password</Label>
            <Input id="pass" type="password" placeholder="••••••••" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Badges & Skeleton</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="danger">Danger</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Skeleton className="h-6 w-40" />
        </CardContent>
      </Card>
    </div>
  );
}