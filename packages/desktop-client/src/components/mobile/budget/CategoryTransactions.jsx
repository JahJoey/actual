import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useDebounceCallback } from 'usehooks-ts';

import { getPayees } from 'loot-core/client/actions';
import { useTransactions } from 'loot-core/client/data-hooks/transactions';
import * as queries from 'loot-core/client/queries';
import { listen } from 'loot-core/platform/client/fetch';
import * as monthUtils from 'loot-core/shared/months';
import { q } from 'loot-core/shared/query';
import { isPreviewId } from 'loot-core/shared/transactions';

import { useDateFormat } from '../../../hooks/useDateFormat';
import { useNavigate } from '../../../hooks/useNavigate';
import { TextOneLine } from '../../common/TextOneLine';
import { View } from '../../common/View';
import { MobilePageHeader, Page } from '../../Page';
import { MobileBackButton } from '../MobileBackButton';
import { AddTransactionButton } from '../transactions/AddTransactionButton';
import { TransactionListWithBalances } from '../transactions/TransactionListWithBalances';

export function CategoryTransactions({ category, month }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const baseTransactionsQuery = useCallback(
    () =>
      q('transactions')
        .options({ splits: 'inline' })
        .filter(getCategoryMonthFilter(category, month)),
    [category, month],
  );

  const {
    transactions,
    isLoading,
    loadMore: loadMoreTransactions,
    reload: reloadTransactions,
    updateQuery: updateTransactionsQuery,
  } = useTransactions({
    queryBuilder: () => baseTransactionsQuery().select('*'),
  });

  const dateFormat = useDateFormat() || 'MM/dd/yyyy';

  useEffect(() => {
    return listen('sync-event', ({ type, tables }) => {
      if (type === 'applied') {
        if (
          tables.includes('transactions') ||
          tables.includes('category_mapping') ||
          tables.includes('payee_mapping')
        ) {
          reloadTransactions?.();
        }

        if (tables.includes('payees') || tables.includes('payee_mapping')) {
          dispatch(getPayees());
        }
      }
    });
  }, [dispatch, reloadTransactions]);

  const updateSearchQuery = useDebounceCallback(
    useCallback(
      searchText => {
        if (searchText === '') {
          updateTransactionsQuery(() => baseTransactionsQuery().select('*'));
        } else if (searchText) {
          updateTransactionsQuery(currentQuery =>
            queries.transactionsSearch(currentQuery, searchText, dateFormat),
          );
        }
      },
      [updateTransactionsQuery, baseTransactionsQuery, dateFormat],
    ),
    150,
  );

  const onSearch = useCallback(
    text => {
      updateSearchQuery(text);
    },
    [updateSearchQuery],
  );

  const onOpenTranasction = useCallback(
    transaction => {
      // details of how the native app used to handle preview transactions here can be found at commit 05e58279
      if (!isPreviewId(transaction.id)) {
        navigate(`/transactions/${transaction.id}`);
      }
    },
    [navigate],
  );

  const balance = queries.categoryBalance(category, month);
  const balanceCleared = queries.categoryBalanceCleared(category, month);
  const balanceUncleared = queries.categoryBalanceUncleared(category, month);

  return (
    <Page
      header={
        <MobilePageHeader
          title={
            <View>
              <TextOneLine>{category.name}</TextOneLine>
              <TextOneLine>
                ({monthUtils.format(month, 'MMMM ‘yy')})
              </TextOneLine>
            </View>
          }
          leftContent={<MobileBackButton />}
          rightContent={<AddTransactionButton categoryId={category.id} />}
        />
      }
      padding={0}
    >
      <TransactionListWithBalances
        isLoading={isLoading}
        transactions={transactions}
        balance={balance}
        balanceCleared={balanceCleared}
        balanceUncleared={balanceUncleared}
        searchPlaceholder={`Search ${category.name}`}
        onSearch={onSearch}
        onLoadMore={loadMoreTransactions}
        onOpenTransaction={onOpenTranasction}
      />
    </Page>
  );
}

function getCategoryMonthFilter(category, month) {
  return {
    category: category.id,
    date: { $transform: '$month', $eq: month },
  };
}
