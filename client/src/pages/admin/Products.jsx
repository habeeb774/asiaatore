import React, { useMemo, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import DataTable from '../../components/admin/DataTable';
import ConfirmModal from '../../components/admin/ConfirmModal';
import Drawer from '../../components/ui/Drawer';
import ImageUploader from '../../components/admin/ImageUploader';
import { useProducts } from '../../api/products';

export default function AdminProducts() {
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const { data, isLoading, refetch } = useProducts({ q, page, pageSize });
	const products = data?.items || data || [];
	const total = data?.total ?? products.length;

	const [drawerProduct, setDrawerProduct] = useState(null);
	const [confirm, setConfirm] = useState(null);

	const rows = useMemo(() => {
		const term = q.trim().toLowerCase();
		return (products || []).filter(p => !term || String(p.id).includes(term) || (p.name?.toLowerCase()?.includes(term)));
	}, [products, q]);

	const [inlineEdit, setInlineEdit] = useState({});
	function startEdit(id, key, value) { setInlineEdit({ id, key, value }); }
	function commitEdit() {
		// TODO: call API to patch product
		setInlineEdit({});
	}

	const cols = [
		{ header: 'ID', accessorKey: 'id', width: '100px' },
		{ header: 'Name', cell: (r) => r.name || r.title },
		{ header: 'Price', cell: (r) => {
			const editing = inlineEdit.id === r.id && inlineEdit.key === 'price';
			return editing ? (
				<div className="flex items-center gap-2">
					<input className="border rounded px-2 py-1 w-24" type="number" value={inlineEdit.value} onChange={(e)=> setInlineEdit({ ...inlineEdit, value: e.target.value })} />
					<button className="btn-primary btn-xs" onClick={commitEdit}>Save</button>
				</div>
			) : (
				<button className="btn-ghost btn-xs" onClick={(e)=>{ e.stopPropagation(); startEdit(r.id, 'price', r.price); }}>{Number(r.price||0).toFixed(2)} SAR</button>
			);
		} },
		{ header: 'Stock', accessorKey: 'stock' },
		{ header: 'Status', cell: (r) => (r.active ? 'Active' : 'Hidden') },
		{ header: 'Actions', cell: (r) => (
			<div className="flex items-center gap-2">
				<button className="btn-outline btn-xs" onClick={(e)=>{ e.stopPropagation(); setDrawerProduct(r); }}>Edit</button>
				<button className="btn-outline btn-xs" onClick={(e)=>{ e.stopPropagation(); setConfirm({ action:'delete', product:r }); }}>Delete</button>
			</div>
		) }
	];

	const topbar = (
		<div className="flex items-center gap-2">
			<input className="border rounded px-3 py-1 text-sm" placeholder="بحث بالاسم/الرقم" value={q} onChange={(e)=> setQ(e.target.value)} />
			<button className="btn-outline" onClick={()=> refetch()}>تحديث</button>
			<button className="btn-primary" onClick={()=> setConfirm({ action:'bulkEdit' })}>Bulk editor</button>
			<button className="btn-outline" onClick={()=> setConfirm({ action:'create' })}>New product</button>
		</div>
	);

	return (
		<AdminLayout title="المنتجات" topbar={topbar}>
			{isLoading ? (
				<div className="skeleton h-24" />
			) : (
				<DataTable
					columns={cols}
					data={rows}
					serverMode={!!data?.total}
					page={page}
					pageSize={pageSize}
					total={total}
					onPageChange={setPage}
					onPageSizeChange={(n)=>{ setPageSize(n); setPage(1); }}
					onRowClick={(row)=> setDrawerProduct(row)}
				/>
			)}

			<Drawer open={!!drawerProduct} onClose={()=> setDrawerProduct(null)} title={drawerProduct ? `Product #${drawerProduct.id}` : ''}>
				{drawerProduct && (
					<div className="space-y-4 text-sm">
						<div className="font-semibold">Images</div>
						<ImageUploader onChange={(payload)=> console.log('upload', payload)} />
						<div className="font-semibold">Fields</div>
						<div className="grid grid-cols-2 gap-3">
							<label className="text-xs">Name<input className="mt-1 border rounded px-2 py-1 w-full" defaultValue={drawerProduct.name} /></label>
							<label className="text-xs">Price<input className="mt-1 border rounded px-2 py-1 w-full" defaultValue={drawerProduct.price} type="number" /></label>
							<label className="text-xs">Stock<input className="mt-1 border rounded px-2 py-1 w-full" defaultValue={drawerProduct.stock} type="number" /></label>
						</div>
						<div className="pt-2">
							<button className="btn-primary">Save changes</button>
						</div>
					</div>
				)}
			</Drawer>

			<ConfirmModal
				open={!!confirm}
				onClose={()=> setConfirm(null)}
				title={confirm?.action === 'delete' ? 'Delete product' : 'Bulk editor'}
				danger={confirm?.action === 'delete'}
				message={confirm?.action === 'delete' ? `Delete ${confirm.product?.name || confirm.product?.id}?` : 'Open bulk editor (coming soon)'}
				confirmText={confirm?.action === 'delete' ? 'Delete' : 'OK'}
				onConfirm={()=> setConfirm(null)}
			/>
		</AdminLayout>
	);
}

    