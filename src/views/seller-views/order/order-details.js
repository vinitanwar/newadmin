import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Table,
  Image,
  Tag,
  Button,
  Space,
  Row,
  Avatar,
  Col,
  Typography,
  Skeleton,
  Steps,
  Spin,
  Tooltip,
} from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Link, useParams } from 'react-router-dom';
import orderService from '../../../services/seller/order';
import getImage from '../../../helpers/getImage';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { disableRefetch, setMenuData } from '../../../redux/slices/menu';
import OrderStatusModal from './orderStatusModal';
import { useTranslation } from 'react-i18next';
import numberToPrice from '../../../helpers/numberToPrice';
import { fetchRestOrderStatus } from '../../../redux/slices/orderStatus';
import { BsCalendarDay, BsFillTelephoneFill } from 'react-icons/bs';
import { MdLocationOn } from 'react-icons/md';
import { IMG_URL } from '../../../configs/app-global';
import { BiMessageDots, BiMoney } from 'react-icons/bi';
import { FiShoppingCart } from 'react-icons/fi';
import { IoMapOutline } from 'react-icons/io5';
import moment from 'moment';
import useDemo from '../../../helpers/useDemo';

export default function SellerOrderDetails() {
  const { activeMenu } = useSelector((state) => state.menu, shallowEqual);
  const { defaultCurrency } = useSelector(
    (state) => state.currency,
    shallowEqual
  );
  const { statusList } = useSelector(
    (state) => state.orderStatus,
    shallowEqual
  );
  const data = activeMenu?.data?.data;
  const { t } = useTranslation();
  const { id } = useParams();
  const dispatch = useDispatch();
  const totalPriceRef = useRef();
  const productListRef = useRef();

  const { isDemo } = useDemo();
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderDeliveryDetails, setOrderDeliveryDetails] = useState(null);
  const [locationsMap, setLocationsMap] = useState(null);
  const { myShop } = useSelector((state) => state.myShop, shallowEqual);
  const columns = [
    {
      title: t('id'),
      dataIndex: 'id',
      key: 'id',
      render: (_, row) => row.stock?.id,
    },
    {
      title: t('product.name'),
      dataIndex: 'product',
      key: 'product',
      render: (_, row) => (
        <Space direction='vertical' className='relative'>
          {row.stock?.product?.translation?.title}
          {!!row.note && (
            <Tooltip title={row.note} className='product-note'>
              <InfoCircleOutlined />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: t('image'),
      dataIndex: 'img',
      key: 'img',
      render: (_, row) => (
        <Image
          src={getImage(row.stock?.product?.img)}
          alt='product'
          width={100}
          height='auto'
          className='rounded'
          preview
          placeholder
        />
      ),
    },
    {
      title: t('price'),
      dataIndex: 'origin_price',
      key: 'origin_price',
      render: (origin_price) =>
        numberToPrice(origin_price, defaultCurrency?.symbol),
    },
    {
      title: t('quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      render: (_, row) => (
        <span>
          {row.quantity * (row?.stock?.product?.interval || 1)}
          {row?.stock?.product?.unit?.translation?.title}
        </span>
      ),
    },
    {
      title: t('discount'),
      dataIndex: 'discount',
      key: 'discount',
      render: (discount = 0, row) =>
        numberToPrice(discount / row.quantity, defaultCurrency?.symbol),
    },
    {
      title: t('tax'),
      dataIndex: 'tax',
      key: 'tax',
      render: (tax, row) =>
        numberToPrice(tax / row.quantity, defaultCurrency?.symbol),
    },
    {
      title: t('total.price'),
      dataIndex: 'total_price',
      key: 'total_price',
      render: (total_price, row) => {
        const data =
          total_price +
          row?.addons?.reduce((total, item) => (total += item.total_price), 0);

        return numberToPrice(data, defaultCurrency?.symbol);
      },
    },
  ];

  const documentColumns = [
    {
      title: t('date'),
      dataIndex: 'date',
      key: 'date',
      render: (_, row) => moment(row?.date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('document'),
      dataIndex: 'document',
      key: 'document',
    },
    {
      title: t('number'),
      dataIndex: 'number',
      key: 'number',
    },
    {
      title: t('total.price'),
      dataIndex: 'price',
      key: 'price',
    },
  ];

  const documents = [
    {
      price: numberToPrice(data?.total_price, defaultCurrency.symbol),
      number: (
        <Link to={`/seller/generate-invoice/${data?.id}`}>#{data?.id}</Link>
      ),
      document: t('invoice'),
      date: moment(data?.transaction?.created_at).format('YYYY-MM-DD HH:mm'),
    },
    {
      price: '-',
      number: (
        <Link to={`/seller/generate-invoice/${data?.id}`}>#{data?.id}</Link>
      ),
      document: t('delivery.reciept'),
      date: moment(data?.transaction?.created_at).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const handleCloseModal = () => {
    setOrderDetails(null);
    setOrderDeliveryDetails(null);
    setLocationsMap(null);
  };

  function fetchOrder() {
    setLoading(true);
    orderService
      .getById(id)
      .then(({ data }) => {
        const currency = data.currency;
        const user = data.user;
        const id = data.id;
        const price = data.price;
        const createdAt = data.created_at;
        const details = data.details.map((item) => ({
          ...item,
          title: item.shop?.translation?.title,
        }));
        dispatch(
          setMenuData({
            activeMenu,
            data: { details, currency, user, id, createdAt, price, data },
          })
        );
      })
      .finally(() => {
        setLoading(false);
        dispatch(disableRefetch(activeMenu));
      });
  }

  useEffect(() => {
    const data = {
      shop_id: myShop.id,
    };
    if (activeMenu.refetch) {
      fetchOrder();
      dispatch(fetchRestOrderStatus());
    }
  }, [activeMenu.refetch]);

  const handleShowModal = () => setLocationsMap(id);

  return (
    <div className='order_details'>
      <Card
        className='order-details-info'
        title={
          <>
            <FiShoppingCart className='mr-2 icon' />
            {`${t('order')} ${data?.id ? `#${data?.id} ` : ''}`}{' '}
            {t('from.order')} {data?.user?.firstname}{' '}
            {data?.user?.lastname || ''}
          </>
        }
        extra={
          data?.status !== 'delivered' && data?.status !== 'canceled' ? (
            <Space>
              {data?.status !== 'delivered' && data?.status !== 'canceled' ? (
                <Button type='primary' onClick={() => setOrderDetails(data)}>
                  {t('change.status')}
                </Button>
              ) : null}
            </Space>
          ) : (
            ''
          )
        }
      />

      <Row gutter={24}>
        <Col span={24}>
          <Card>
            <Space className='justify-content-between w-100'>
              <Space
                className='align-items-start'
                onClick={() =>
                  totalPriceRef.current.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <BiMoney className='order-card-icon' />

                <div className='d-flex flex-column'>
                  <Typography.Text>{t('total.price')}</Typography.Text>
                  {loading ? (
                    <Skeleton.Button size={16} loading={loading} />
                  ) : (
                    <Typography.Text className='order-card-title'>
                      {numberToPrice(
                        data?.total_price,
                        defaultCurrency?.symbol
                      )}
                    </Typography.Text>
                  )}
                </div>
              </Space>
              <Space className='align-items-start'>
                <BiMessageDots className='order-card-icon' />
                <div className='d-flex flex-column'>
                  <Typography.Text>{t('messages')}</Typography.Text>
                  {loading ? (
                    <Skeleton.Button size={16} />
                  ) : (
                    <Typography.Text className='order-card-title'>
                      {data?.review ? 1 : 0}
                    </Typography.Text>
                  )}
                </div>
              </Space>
              <Space
                className='align-items-start'
                onClick={() =>
                  productListRef.current.scrollIntoView({ behavior: 'smooth' })
                }
              >
                <FiShoppingCart className='order-card-icon' />
                <div className='d-flex flex-column'>
                  <Typography.Text>{t('products')}</Typography.Text>
                  {loading ? (
                    <Skeleton.Button size={16} />
                  ) : (
                    <Typography.Text className='order-card-title'>
                      {data?.details?.reduce(
                        (total, item) => (total += item.quantity),
                        0
                      )}
                    </Typography.Text>
                  )}
                </div>
              </Space>
            </Space>
          </Card>
        </Col>
        {data?.status !== 'canceled' && (
          <Col span={24}>
            <Card>
              <Steps
                current={statusList?.findIndex(
                  (item) => item.name === data?.status
                )}
              >
                {statusList?.slice(0, -1).map((item) => (
                  <Steps.Step key={item.id} title={t(item.name)} />
                ))}
              </Steps>
            </Card>
          </Col>
        )}
        <Col span={16}>
          <Spin spinning={loading}>
            <Card style={{ minHeight: '200px' }}>
              <Row hidden={loading} className='mb-3 order_detail'>
                <Col span={12}>
                  <div>
                    {t('created.date.&.time')}:
                    <span className='ml-2'>
                      <BsCalendarDay className='mr-1' />{' '}
                      {moment(data?.created_at).format('YYYY-MM-DD HH:mm')}{' '}
                    </span>
                  </div>
                  <br />
                  {data?.delivery_type === 'dine_in' && (
                    <div>
                      {t('table')}:
                      <span className='ml-2'>{data?.table?.name}</span>
                    </div>
                  )}
                  {data?.delivery_type !== 'dine_in' && (
                    <div>
                      {t('payment.status')}:
                      <span className='ml-2'>
                        {t(data?.transaction?.status)}
                      </span>
                    </div>
                  )}
                </Col>
                <Col span={12}>
                  <div>
                    {t('status')}:
                    <span className='ml-2'>
                      {data?.status === 'new' ? (
                        <Tag color='blue'>{t(data?.status)}</Tag>
                      ) : data?.status === 'canceled' ? (
                        <Tag color='error'>{t(data?.status)}</Tag>
                      ) : (
                        <Tag color='cyan'>{t(data?.status)}</Tag>
                      )}
                    </span>
                  </div>
                  <br />
                  <div>
                    {t('delivery.type')}:
                    <span className='ml-2'>{data?.delivery_type}</span>
                  </div>
                  {data?.delivery_type !== 'dine_in' && (
                    <>
                      <br />
                      <div>
                        {t('payment.type')}:
                        <span className='ml-2'>
                          {t(data?.transaction?.payment_system?.tag)}
                        </span>
                      </div>
                      <br />
                      <div>
                        {t('address')}:
                        <span className='ml-2'>{data?.address?.address}</span>
                      </div>
                      <br />
                      <div>
                        {t('office')}:
                        <span className='ml-2'>{data?.address?.office}</span>
                      </div>
                      <br />
                    </>
                  )}
                </Col>
              </Row>
            </Card>
          </Spin>
          {data?.delivery_type !== 'dine_in' && (
            <Card title={t('documents')}>
              <Table
                columns={documentColumns}
                dataSource={documents}
                pagination={false}
                loading={loading}
              />
            </Card>
          )}
          <Card className='w-100 order-table'>
            <Table
              ref={productListRef}
              scroll={{ x: true }}
              columns={columns}
              dataSource={activeMenu.data?.details || []}
              loading={loading}
              rowKey={(record) => record.id}
              pagination={false}
            />
            <Space
              size={100}
              className='d-flex justify-content-end w-100 order-table__summary'
            >
              <div>
                <span>{t('delivery.fee')}:</span>
                <br />
                <span>{t('order.tax')}:</span>
                <br />
                <span>{t('product')}:</span>
                <br />
                <span>{t('discount')}:</span>
                <br />
                {data?.coupon && (
                  <>
                    <span>{t('coupon')}:</span>
                    <br />
                  </>
                )}
                <span>{t('service.fee')}:</span>
                <br />
                <h3>{t('total.price')}:</h3>
              </div>
              <div>
                <span>
                  {numberToPrice(data?.delivery_fee, defaultCurrency?.symbol)}
                </span>
                <br />
                <span>{numberToPrice(data?.tax, defaultCurrency?.symbol)}</span>
                <br />
                <span>
                  {numberToPrice(data?.origin_price, defaultCurrency?.symbol)}
                </span>
                <br />
                <span>
                  {numberToPrice(data?.total_discount, defaultCurrency?.symbol)}
                </span>
                <br />
                {data?.coupon && (
                  <>
                    <span>
                      {numberToPrice(
                        data?.coupon?.price,
                        defaultCurrency?.symbol
                      )}
                    </span>
                    <br />
                  </>
                )}
                <span>
                  {numberToPrice(data?.service_fee, defaultCurrency?.symbol)}
                </span>
                <br />
                <h3 ref={totalPriceRef}>
                  {numberToPrice(data?.total_price, defaultCurrency?.symbol)}
                </h3>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8} className='order_info'>
          <Card title={t('store.information')}>
            {loading ? (
              <Skeleton avatar shape='square' paragraph={{ rows: 2 }} />
            ) : (
              <Space className='w-100'>
                <Avatar
                  shape='square'
                  size={64}
                  src={IMG_URL + data?.shop?.logo_img}
                />
                <div>
                  <h5>{data?.shop?.translation?.title}</h5>
                  {data?.shop?.phone && (
                    <div className='delivery-info'>
                      <b>
                        <BsFillTelephoneFill />
                      </b>
                      <span>{data?.shop?.phone}</span>
                    </div>
                  )}

                  <div className='delivery-info my-1'>
                    <strong>{t('min.delivery.price')}:</strong>
                    <span>
                      {numberToPrice(
                        data?.shop?.price,
                        defaultCurrency?.symbol
                      )}
                    </span>
                  </div>
                  <div className='delivery-info'>
                    <b>
                      <IoMapOutline size={16} />
                    </b>
                    <span>{data?.shop?.translation?.address}</span>
                  </div>
                </div>
              </Space>
            )}
          </Card>
        </Col>
      </Row>
      {orderDetails && (
        <OrderStatusModal
          orderDetails={orderDetails}
          handleCancel={handleCloseModal}
          status={statusList}
        />
      )}
    </div>
  );
}
