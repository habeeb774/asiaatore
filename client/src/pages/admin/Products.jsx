import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/features/admin/AdminLayout';
import DataTable from '../../components/features/admin/DataTable';
import ConfirmModal from '../../components/features/admin/ConfirmModal';
import Drawer from '../../components/ui/Drawer';
import ImageUploader from '../../components/features/admin/ImageUploader';
import { useProduct } from '../../services/api/products';
import { addProductImage, addProductImages, deleteProductImage, updateProductImage, importProductsFromExcel, exportProductsToExcel } from '../../services/api/products';
import { useProducts, updateProduct, deleteProduct, batchDiscount, batchClearDiscount } from '../../services/api/products';
import { useToast } from '../../stores/ToastContext';

export default function AdminProducts() {
	const navigate = useNavigate();
	const [q, setQ] = useState('');
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(25);
	const { data, isLoading, refetch } = useProducts({ q, page, pageSize });
	const products = data?.items || data || [];
	const total = data?.total ?? products.length;

		const [drawerProduct, setDrawerProduct] = useState(null);
			// Fetch product details when drawer open for gallery and images
			const { data: productDetails, refetch: refetchProduct } = useProduct(drawerProduct?.id, { enabled: !!drawerProduct });
		const toast = useToast();
		const [selectedIds, setSelectedIds] = useState(new Set());
		const [confirmModal, setConfirmModal] = useState(null);
		const uploadInputRef = React.useRef(null);
		const importInputRef = React.useRef(null);
		const [uploadProductId, setUploadProductId] = useState(null);
		const [importingExcel, setImportingExcel] = useState(false);
		const [exportingExcel, setExportingExcel] = useState(false);

	const rows = useMemo(() => {
		const term = q.trim().toLowerCase();
		return (products || []).filter(p => !term || String(p.id).includes(term) || (p.name?.toLowerCase()?.includes(term)));
	}, [products, q]);

	const [inlineEdit, setInlineEdit] = useState({});
		function startEdit(id, key, value) { setInlineEdit({ id, key, value }); }
	function commitEdit() {
			// call API to patch product
			const { id, key, value } = inlineEdit;
			if (!id) return setInlineEdit({});
			updateProduct(id, { [key]: value }).then(() => {
				toast?.success?.('Updated');
				refetch();
			}).catch(err => {
				console.error('update product failed', err);
				toast?.error?.('Failed to update');
			}).finally(() => setInlineEdit({}));
	}

		const cols = [
			{ header: (<input type="checkbox" aria-label="select all" onChange={(e)=>{
				if (e.target.checked) setSelectedIds(new Set(products.map(p=>p.id)));
				else setSelectedIds(new Set());
			}} />), cell: (r)=> (
				<input type="checkbox" aria-label={`select-${r.id}`} checked={selectedIds.has(r.id)} onChange={(e)=>{ e.stopPropagation(); const s = new Set(selectedIds); if (e.target.checked) s.add(r.id); else s.delete(r.id); setSelectedIds(s); }} />
			), width: '40px' },
		{ header: 'ID', accessorKey: 'id', width: '100px' },
		{ header: 'Name', cell: (r) => (typeof r.name === 'string' ? r.name : (r.name?.en || r.name?.ar || r.title || '')) },
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
		<button className="btn-outline btn-xs" title="Edit product" aria-label={`Edit ${r.name?.en||r.name||r.id}`} onClick={(e)=>{ e.stopPropagation(); setDrawerProduct(r); }}>Edit</button>
		<button className="btn-outline btn-xs" title="Upload images" aria-label={`Upload images for ${r.name?.en||r.name||r.id}`} onClick={(e)=>{ e.stopPropagation(); setUploadProductId(r.id); uploadInputRef.current?.click(); }}>Upload images</button>
		<button className="btn-outline btn-xs" title="Delete product" aria-label={`Delete ${r.name?.en||r.name||r.id}`} onClick={(e)=>{ e.stopPropagation(); setConfirmModal({ action:'delete', product:r }); }}>Delete</button>
			<button className="btn-outline btn-xs" title="Copy product link" aria-label={`Copy link ${r.name?.en||r.name||r.id}`} onClick={(e)=>{ e.stopPropagation(); navigator.clipboard?.writeText(`${window.location.origin}/products/${r.slug||r.id}`); toast?.info?.('Link copied'); }}>Copy link</button>
			</div>
		) }
	];

	const handleExportExcel = async () => {
		setExportingExcel(true);
		try {
			const blob = await exportProductsToExcel({ q: q.trim() || undefined });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `products-${new Date().toISOString().slice(0, 10)}.xlsx`;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
			toast?.success?.('تم تصدير المنتجات إلى Excel');
		} catch (err) {
			const apiMessage = err?.body?.message || err?.message || 'فشل التصدير';
			toast?.error?.(apiMessage);
		} finally {
			setExportingExcel(false);
		}
	};

	const topbar = (
		<div className="flex items-center gap-2">
			<input className="border rounded px-3 py-1 text-sm" placeholder="بحث بالاسم/الرقم" value={q} onChange={(e)=> setQ(e.target.value)} />
			<button className="btn-outline" onClick={()=> refetch()}>تحديث</button>
			<button className="btn-primary" onClick={()=> setConfirmModal({ action:'bulkEdit' })}>Bulk editor</button>
			<button className="btn-outline" onClick={()=> navigate('/admin?view=products&create=1')} title="New product" aria-label="New product">New product</button>
			<button
				className="btn-outline"
				onClick={()=> importInputRef.current?.click()}
				disabled={importingExcel}
			>
				{importingExcel ? 'جاري الاستيراد...' : 'استيراد من Excel'}
			</button>
			<button
				className="btn-outline"
				onClick={handleExportExcel}
				disabled={exportingExcel}
			>
				{exportingExcel ? 'جاري التصدير...' : 'تصدير إلى Excel'}
			</button>
			{selectedIds.size > 0 && (
				<>
					<button className="btn-outline" onClick={async ()=>{
						const percent = Number(prompt('Discount percent (0-90)')); if (!percent || percent <= 0) return;
						try { await batchDiscount({ productIds: Array.from(selectedIds), percent }); toast?.success?.('Discount applied'); refetch(); setSelectedIds(new Set()); } catch (err) { toast?.error?.('Batch discount failed'); }
					}}>Apply discount</button>
					<button className="btn-outline" onClick={async ()=>{
						if (!window.confirm('Clear discount for selected products?')) return;
						try { await batchClearDiscount({ productIds: Array.from(selectedIds) }); toast?.success?.('Cleared'); refetch(); setSelectedIds(new Set()); } catch (err) { toast?.error?.('Failed to clear'); }
					}}>Clear discount</button>
					<button className="btn-outline" onClick={()=>{
						// export selected as CSV
						const rows = products.filter(p => selectedIds.has(p.id)).map(p => ({ id:p.id, name: p.name?.en || p.name, price: p.price }));
						const csv = ['id,name,price', ...rows.map(r => `${r.id},"${(r.name||'').replace(/"/g,'""')}",${r.price}`)].join('\n');
						const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'products.csv'; a.click(); URL.revokeObjectURL(url);
					}}>Export CSV</button>
					<button className="btn-danger" onClick={()=>{
						setConfirmModal({ action:'bulkEdit', bulkAction: 'delete' });
					}}>Delete selected</button>
				</>
			)}
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

		<input ref={uploadInputRef} type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
			const files = Array.from(e.target.files || []);
			if (!uploadProductId || !files.length) return;
			try {
				await addProductImages(uploadProductId, files);
				toast?.success?.(`${files.length} images uploaded`);
			} catch (err) {
				console.error('upload failed', err);
				toast?.error?.('Failed to upload images');
			} finally {
				e.target.value = null;
				// refresh
				refetch();
				if (uploadProductId === drawerProduct?.id) refetchProduct?.();
				setUploadProductId(null);
			}
		}} />

		<input
			ref={importInputRef}
			type="file"
			accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
			className="hidden"
			onChange={async (e) => {
				const file = e.target.files?.[0];
				if (!file) return;
				if (file.size > 5 * 1024 * 1024) {
					toast?.error?.('الملف أكبر من 5 ميجابايت. الرجاء اختيار ملف أصغر.');
					e.target.value = null;
					return;
				}
				setImportingExcel(true);
				try {
					const summary = await importProductsFromExcel(file);
					toast?.success?.(`تم إنشاء ${summary.created || 0} وتحديث ${summary.updated || 0}. تخطي ${summary.skipped || 0}.`);
					if (summary.errors?.length) {
						console.warn('Excel import warnings', summary.errors);
					}
					refetch();
				} catch (err) {
					console.error('Excel import failed', err);
					const apiError = err?.response?.data?.message || err?.message || 'فشل الاستيراد';
					toast?.error?.(apiError);
				} finally {
					setImportingExcel(false);
					e.target.value = null;
				}
			}}
		/>

		<Drawer open={!!drawerProduct} onClose={()=> setDrawerProduct(null)} title={drawerProduct ? `Product #${drawerProduct.id}` : ''}>
				{drawerProduct && (
					<div className="space-y-4 text-sm">
												<div className="font-semibold">Images</div>
																		<ImageUploader onChange={async (payload)=>{
													// Upload each file for the selected product
													if (!drawerProduct) return;
													const files = payload?.files || [];
																									  try {
																										  await addProductImages(drawerProduct.id, files);
																										  toast?.success?.(`${files.length} images uploaded`);
																									  } catch (err) {
																										  toast?.error?.('Upload failed');
																									  }
																			refetch();
																			refetchProduct?.();
													// optional: refetch single product details if needed
												}} />

												{/* Gallery */}
																		<div className="mt-3 grid grid-cols-4 gap-2">
																			{(productDetails?.images || []).map((img) => (
														<div key={img.id} className="relative">
															<img src={img.variants?.original || img.url} alt={img.alt?.en || ''} className="w-full h-24 object-cover rounded" />
															<div className="absolute top-1 right-1 flex gap-1">
																<button className="btn-xs btn-outline" onClick={async (e)=>{ e.stopPropagation(); try { await updateProductImage(img.id, { sort: 0 }); toast?.success?.('Set primary'); refetch(); refetchProduct?.(); } catch(err){ toast?.error?.('Failed'); } }}>Set primary</button>
																<button className="btn-xs btn-danger" onClick={async (e)=>{ e.stopPropagation(); if (!window.confirm('Delete image?')) return; try { await deleteProductImage(img.id); toast?.success?.('Deleted'); refetch(); refetchProduct?.(); } catch(err){ toast?.error?.('Failed to delete'); } }}>✕</button>
															</div>
														</div>
													))}
												</div>
						<div className="font-semibold">Fields</div>
						<form className="product-detail-form">
						<div className="grid grid-cols-2 gap-3">
								<label className="text-xs">Name<input name="name" className="mt-1 border rounded px-2 py-1 w-full" defaultValue={drawerProduct.name?.en || drawerProduct.name} /></label>
								<label className="text-xs">Price<input name="price" className="mt-1 border rounded px-2 py-1 w-full" defaultValue={drawerProduct.price} type="number" /></label>
								<label className="text-xs">Stock<input name="stock" className="mt-1 border rounded px-2 py-1 w-full" defaultValue={drawerProduct.stock} type="number" /></label>
							</div>
						</form>
												<div className="pt-2">
														<button className="btn-primary" onClick={async ()=>{
															try {
																const form = document.querySelector('.product-detail-form');
																const inputs = Array.from(form.querySelectorAll('input')).reduce((acc, el)=> { acc[el.name] = el.value; return acc; }, {});
																await updateProduct(drawerProduct.id, { nameEn: inputs.name, price: Number(inputs.price), stock: Number(inputs.stock) });
																toast?.success?.('Saved'); refetch(); setDrawerProduct(null);
															} catch (err) { toast?.error?.('Save failed'); }
														}}>Save changes</button>
												</div>
					</div>
				)}
			</Drawer>

			<ConfirmModal
				open={!!confirmModal}
				onClose={()=> setConfirmModal(null)}
				title={confirmModal?.action === 'delete' ? 'Delete product' : 'Bulk editor'}
				danger={confirmModal?.action === 'delete'}
				message={confirmModal?.action === 'delete' ? `Delete ${confirmModal.product?.name || confirmModal.product?.id}?` : 'Open bulk editor (coming soon)'}
				confirmText={confirmModal?.action === 'delete' ? 'Delete' : 'OK'}
				onConfirm={async ()=> {
					if (confirmModal?.action === 'delete') {
						try { await deleteProduct(confirmModal.product.id); toast?.success?.('Deleted'); refetch(); } catch (err) { toast?.error?.('Delete failed'); }
					}
					if (confirmModal?.action === 'bulkEdit' && confirmModal?.bulkAction === 'delete' && selectedIds.size) {
						const ids = Array.from(selectedIds);
						for (const id of ids) { try { await deleteProduct(id); } catch {} }
						toast?.success?.('Bulk delete done'); refetch(); setSelectedIds(new Set());
					}
					setConfirmModal(null);
				}}
			/>
		</AdminLayout>
	);
}

    