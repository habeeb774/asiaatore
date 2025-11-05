import React from 'react';
import { Button } from '../components/ui';
import { Badge } from '../components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui';

// Tiny UI preview playground to exercise variants and sizes
export default function UIPreview() {
  const sections = [
    {
      title: 'Buttons',
      content: (
        <div className="flex flex-wrap gap-3 items-center">
          <Button variant="primary" size="sm">Primary sm</Button>
          <Button variant="primary" size="md">Primary md</Button>
          <Button variant="primary" size="lg">Primary lg</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="accent">Accent</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading>Loading…</Button>
        </div>
      )
    },
    {
      title: 'Badges',
      content: (
        <div className="flex flex-wrap gap-3 items-center">
          <Badge size="sm">neutral sm</Badge>
          <Badge size="md">neutral md</Badge>
          <Badge size="lg">neutral lg</Badge>
          <Badge variant="info">info</Badge>
          <Badge variant="success">success</Badge>
          <Badge variant="warning">warning</Badge>
          <Badge variant="danger">danger</Badge>
        </div>
      )
    },
    {
      title: 'Chips',
      content: (
        <div className="flex flex-wrap gap-3 items-center">
          <Chip size="sm">Outline sm</Chip>
          <Chip size="md" selected>Outline md (selected)</Chip>
          <Chip size="lg">Outline lg</Chip>
          <Chip variant="primary">Primary</Chip>
          <Chip variant="soft">Soft</Chip>
        </div>
      )
    },
    {
      title: 'Cards',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Default card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-80">Content area with body text.</p>
            </CardContent>
          </Card>
          <Card variant="outline">
            <CardHeader>
              <CardTitle>Outline card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-80">Outlined style.</p>
            </CardContent>
          </Card>
          <Card variant="flat">
            <CardHeader>
              <CardTitle>Flat card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-80">Low elevation.</p>
            </CardContent>
          </Card>
          <Card variant="ghost">
            <CardHeader>
              <CardTitle>Ghost card</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-80">Ghost background.</p>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: 'Skeletons',
      content: (
        <div className="flex flex-wrap gap-4 items-center">
          <Skeleton size="sm" className="w-24" />
          <Skeleton size="md" className="w-36" />
          <Skeleton size="lg" className="w-48" />
          <Skeleton variant="text" className="w-56 h-4" />
          <Skeleton variant="circle" className="w-10 h-10 rounded-full" />
          <Skeleton variant="static" className="w-32 h-20" />
        </div>
      )
    }
  ];

  return (
    <div className="container-custom py-8">
      <h1 className="text-2xl font-bold mb-6">UI Preview</h1>
      <div className="space-y-8">
        {sections.map((s, i) => (
          <section key={i}>
            <h2 className="text-lg font-semibold mb-3">{s.title}</h2>
            {s.content}
          </section>
        ))}
      </div>
    </div>
  );
}
