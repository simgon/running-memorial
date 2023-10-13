import { Common } from './common';

/**
 * RouteMapクラス
 */
export class RouteMap extends google.maps.Map {
  constructor(element, mapOptions) {
    super(element, mapOptions);
  
    // 現在位置へ移動カスタムコントロールを作成
    const myLocationContainer = document.createElement('div');
    myLocationContainer.className = 'my-location';

    const myLocationIcon = document.createElement('div');
    myLocationIcon.className = 'icon';
    myLocationContainer.appendChild(myLocationIcon);
  
    google.maps.event.addDomListener(myLocationContainer, 'click', () => {
      // マップをユーザーの現在位置に設定
      this.setMapMyLocation();
    });
  
    // カスタムコントロールを配置
    this.controls[(Common.isMobileScreen ? google.maps.ControlPosition.RIGHT_TOP : google.maps.ControlPosition.RIGHT_BOTTOM)].push(myLocationContainer);

    // ズーム値変更カスタムコントロールを作成
    const zoomContainer = document.createElement('div');
    zoomContainer.className = 'zoom-map';
    
    const zoomIconS = document.createElement('div');
    zoomIconS.className = 'icon S';
    google.maps.event.addDomListener(zoomIconS, 'click', () => {
      this.setZoom(16);
    });
    zoomContainer.appendChild(zoomIconS);

    const zoomIconM = document.createElement('div');
    zoomIconM.className = 'icon M';
    google.maps.event.addDomListener(zoomIconM, 'click', () => {
      this.setZoom(14);
    });
    zoomContainer.appendChild(zoomIconM);

    const zoomIconL = document.createElement('div');
    zoomIconL.className = 'icon L';
    google.maps.event.addDomListener(zoomIconL, 'click', () => {
      this.setZoom(13);
    });
    zoomContainer.appendChild(zoomIconL);

    this.controls[google.maps.ControlPosition.RIGHT].push(zoomContainer);
  }

  /**
   * ユーザーの現在位置を取得
   */
  getMyLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function (position) {
            resolve(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
          },
          function (error) {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation is not supported in this browser.'));
      }
    });
  }

  /**
   * マップをユーザーの現在位置に設定
   */
  setMapMyLocation() {
    this.getMyLocation()
      .then((position) => {
        // 位置情報を取得できた場合の処理
        // マップの中心をユーザーの現在位置に移動
        this.setCenter(position);

        Common.setCookie('user_lat', position.lat());
        Common.setCookie('user_lng', position.lng());
      })
      .catch((error) => {
        // 位置情報の取得に失敗した場合の処理
        console.error('Error:', error);
        Common.showNotification('位置情報を取得できませんでした。');
      });
  }
}

/**
 * RouteManagerクラス
 */
export class RouteManager {
  // 登録ルート上限数
  static MAX_ROUTE = 10;
  // 登録ルートマーカー上限数
  static MAX_ROUTE_MARKER = 100;

  constructor(map) {
    this.map = map;
    this.routes = {};               // ルート一覧を保持
    this.selectedRoute = null;      // 選択ルートを保持
    this.selectedDotMarker = null;  // 選択位置マーカーを保持
    this.selectedRouteLine = null;  // 選択ルート線を保持

    RouteManager.instance = this;
  }

  static getInstance() {
    return RouteManager.instance;
  }

  /**
   * マーカー追加
   */
  addMarker(position) {
    // ルート未選択の場合
    if (!this.selectedRoute) return;

    // admin有無
    const admin = document.querySelector('#admin')?.value == 'true';
    // ルート地点上限数チェック
    if (this.selectedRoute.dotMarkers.length >= RouteManager.MAX_ROUTE_MARKER && !admin) {
      Common.showNotification(`ルート地点数が上限(${RouteManager.MAX_ROUTE_MARKER}地点)に達しました。`);
      return;
    }

    // マーカー追加
    this.selectedRoute.addMarker(position);
  }

  /**
   * ルート上にマーカー追加
   */
  addMarkerOnLine(position) {
    // ルート未選択の場合
    if (!this.selectedRoute || !this.selectedRouteLine) return;

    // ルート上にマーカー追加
    this.selectedRoute.addMarkerOnLine(this.selectedRouteLine, position);
    this.selectedRouteLine = null;
  }

  /**
   * マーカー削除
   */
  removeMarker() {
    // ルート未選択の場合
    if (!this.selectedRoute || !this.selectedDotMarker) return;
    // マーカー削除
    this.selectedRoute.removeMarker(this.selectedDotMarker);
    this.selectedDotMarker = null;
  }

  /**
   * ボタン切替
   */
  switchMode() {
    // ルート未選択の場合
    if (!this.selectedRoute) return;

    let addMarker = document.getElementById('add-marker');
    let addLineMarker = document.getElementById('add-line-marker');
    let removeMarker = document.getElementById('remove-marker');

    // 追加ボタン → ルート上追加ボタン
    if (!addMarker.classList.contains('hidden')) {
      addMarker.classList.add('hidden');
      addLineMarker.classList.remove('hidden');
      removeMarker.classList.add('hidden');

    // ルート上追加ボタン → 削除ボタン
    } else if (!addLineMarker.classList.contains('hidden')) {
      addMarker.classList.add('hidden');
      addLineMarker.classList.add('hidden');
      removeMarker.classList.remove('hidden');

    // 削除ボタン → 追加ボタン
    } else if (!removeMarker.classList.contains('hidden')) {
      addMarker.classList.remove('hidden');
      addLineMarker.classList.add('hidden');
      removeMarker.classList.add('hidden');
    }
  }

  /**
   * １つ戻す
   */
  undo() {
    // ルート未選択の場合
    if (!this.selectedRoute) return;
    // １つ戻す
    this.selectedRoute.undoMng.undo();
  }

  /**
   * クリア
   */
  clearMarkers() {
    // ルート未選択の場合
    if (!this.selectedRoute) return;

    // 全てのマーカーを削除
    this.selectedRoute.clearMarkers();
    
    // ロケーション情報を取得
    RouteManager.fetchLocations(this.selectedRoute.routeId)
      .then((data) => {
        // マップ上にマーカーを表示
        data.forEach(loc => {
          const position = new google.maps.LatLng(loc.lat_loc, loc.lon_loc);
          this.selectedRoute.addMarker(position, {init: true, visibleNotYetSaveLabel: false, pushUndo: false});
          // ドラッグ可能
          this.selectedRoute.dotMarkers.forEach(dotMarker => dotMarker.setDraggable(true));
        });
      })
      .catch((error) => {
        console.error(error);
      })
  }

  /**
   * 保存
   */
  save() {
    // ルート未選択の場合
    if (!this.selectedRoute) return;
    // 保存
    this.postRoute();
    // 未保存ラベルを非表示
    this.selectedRoute.visibleNotYetSaveLabel(false);
  }

  /**
   * ルート情報を登録
   */
  postRoute() {
    // ルート情報を登録
    Common.postRequest(
      '/locations',
      {
        route_param: {
          routeId: this.selectedRoute.routeId,
          locations: this.selectedRoute.dotMarkers.map((marker) => ({ lat_loc: marker.position.lat(), lon_loc: marker.position.lng() }))
        }
      },
      '保存しました'
    );
  }

  /**
   * ドットマーカーを作成
   */
  createDotMarker(route, position) {
    // ドットマーカーを作成
    const dotMarker = new google.maps.Marker({
      position: position,
      map: this.map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillOpacity: 1,
        fillColor: '#3CB371', // ドットの色を指定
        strokeOpacity: 0,
        scale: 2,             // ドットのサイズを指定
      },
      draggable: true,        // ドラッグ可能にする
      cursor: 'pointer'       // カーソルのスタイルを指定
    });

    dotMarker.customId = route.routeId + '-' + route.dotMarkers.length;

    // -------------------
    // イベント処理
    // -------------------
    // ドラッグ後のクリック動作を制御（ドラッグ後にクリックイベントが走ることがあるので、待機時間を設ける）
    let isDragging = false;

    let longPressTimer;
    let touchStartTime;
    let longPressThreshold = 500; // ロングタップと判定する時間（ミリ秒）

    const isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;

    if (isTouchDevice) {
      // タッチデバイスの場合
      // タッチ開始時の処理
      dotMarker.addListener('mousedown', (event) => {
        touchStartTime = new Date().getTime();

        // ロングタップ時
        longPressTimer = setTimeout(() => {
          // 右クリックされたマーカーを削除
          route.removeMarker(dotMarker);
        }, longPressThreshold);
      });

      // タッチ終了時の処理
      dotMarker.addListener('mouseup', (event) => {
        clearTimeout(longPressTimer);

        const touchEndTime = new Date().getTime();
        const touchDuration = touchEndTime - touchStartTime;

        if (touchDuration >= longPressThreshold || touchStartTime === undefined) {
          // ロングタップと判定（当if文は通らない。removeMarkerでdotMarkerが削除されるため、mouseupイベントは発火しない）
          // longPressTimerにてロングタップ時処理を実施
        } else {
          // 通常のクリック処理
          // ドラッグ待機中の場合
          if (isDragging) return;

          // マップ上のクリックされた場所にマーカーを追加
          this.selectedRoute?.addMarker(event.latLng);
        }
      });
    } else {
      // PCの場合
      // ドットマーカーをクリック時
      dotMarker.addListener('click', (event) => {
        // ドラッグ待機中の場合
        if (isDragging) return;

        // マップ上のクリックされた場所にマーカーを追加
        this.selectedRoute?.addMarker(event.latLng);
      });

      // ドットマーカーを右クリック時
      dotMarker.addListener('rightclick', (event) => {
        // 右クリックされたマーカーを削除
        route.removeMarker(dotMarker);
      });
    }

    // 移動前位置を保持
    let prevPosition;

    // ドットマーカードラッグ開始時
    dotMarker.addListener('dragstart', (event) => {
      // 移動前位置を保持
      prevPosition = event.latLng;

      // ロングタップをキャンセル
      clearTimeout(longPressTimer);
    });
    
    // ドットマーカードラッグ完了時、マーカーを移動
    dotMarker.addListener('dragend', (event) => {
      // ドラッグ待機中
      isDragging = true;
      setTimeout(() => isDragging = false, 1000);

      // マーカーを移動
      route.moveMarker(dotMarker, dotMarker.position ,prevPosition);
    });

    return dotMarker;
  }

  /**
   * ルート線を作成
   */
  createRouteLine(route, path) {
    // ルート線を作成
    const routeLine = new google.maps.Polyline({
      path: path,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: this.map,
      // editable: true, // ライン上の点をドラッグ可能にする
    });

    routeLine.customId = route.routeId + '-' + route.routeLines.length;

    // -------------------
    // イベント処理
    // -------------------
    let longPressTimer;
    let touchStartTime;
    let longPressThreshold = 500; // ロングタップと判定する時間（ミリ秒）

    const isTouchDevice = 'ontouchstart' in window || navigator.msMaxTouchPoints;

    if (isTouchDevice) {
      // タッチデバイスの場合
      // タッチ開始時の処理
      routeLine.addListener('mousedown', (event) => {
        touchStartTime = new Date().getTime();

        // ロングタップ時
        longPressTimer = setTimeout(() => {
          // ルート線上にマーカーを追加
          route.addMarkerOnLine(routeLine, event.latLng);
        }, longPressThreshold);
      });

      // タッチ終了時の処理
      routeLine.addListener('mouseup', (event) => {
        clearTimeout(longPressTimer);

        const touchEndTime = new Date().getTime();
        const touchDuration = touchEndTime - touchStartTime;

        // addMarkerOnLine内の距離ラベルの「this.setMap(map);」が実行されるとtouchStartTimeがundefinedになるため、undefinedの場合ロングタップと判定
        if (touchDuration >= longPressThreshold || touchStartTime === undefined) {
          // ロングタップと判定
          // longPressTimerにてロングタップ時処理を実施
        } else {
          // 通常のクリック処理
          // クリックされた場所にマーカーを追加
          this.selectedRoute?.addMarker(event.latLng);
        }
      });
    } else {
      // PCの場合
      // ルート線上をクリック時
      routeLine.addListener('click', (event) => {
        // クリックされた場所にマーカーを追加
        this.selectedRoute?.addMarker(event.latLng);
      });

      // ルート線上を右クリック時
      routeLine.addListener('rightclick', (event) => {
        // ルート線上にマーカーを追加
        route.addMarkerOnLine(routeLine, {lat: event.latLng.lat(), lng: event.latLng.lng()});
      });
    }

    return routeLine;
  }

  /**
   * 距離ラベルを作成
   */
  createDistanceLabel(position, distance = 0) {
    // 距離ラベルを作成
    const customLabel = new DistanceLabelOverlay(this.map, position, '0m', distance);
    return customLabel;
  }

  /**
   * 同一地点で重なったルート線と距離ラベルの重複を排除（ルート色を考慮して１つのルート線のみを表示）
   */
  displayMostRelevantRoute() {
    // ルート線の重複を非表示にする
    Object.values(this.routes).filter(route => {
      // 「ルート表示」、「ルート表示(ルートのみ)」のみに絞り込む
      let visible = document.querySelector(`[data-route-id="${route.routeId}"]`).getAttribute('data-visible');
      return visible == Route.VISIBLE_ALL || visible == Route.VISIBLE_ROUTE;
    }).forEach((route, index, routeArray) => {
      // ルート線同士を比較
      route.routeLines.forEach(line => {
        let lineSt = line.getPath().getAt(0);
        let lineEd = line.getPath().getAt(1);

        routeArray.slice(index + 1).forEach(routeOther => {
          routeOther.routeLines.forEach(lineOther => {
            let lineStOther = lineOther.getPath().getAt(0);
            let lineEdOther = lineOther.getPath().getAt(1);

            // 同一地点のルート線の場合、片方のルート線を非表示にする
            if (lineSt.equals(lineStOther) && lineEd.equals(lineEdOther)) {
              line.setMap(null);
            }
          });
        });
      });
    });

    // 距離ラベルの重複を非表示にする
    Object.values(this.routes).filter(route => {
      // 「ルート表示」のみに絞り込む
      let visible = document.querySelector(`[data-route-id="${route.routeId}"]`).getAttribute('data-visible');
      return visible == Route.VISIBLE_ALL;
    }).forEach((route, index, routeArray) => {
      // 距離ラベル同士を比較
      route.distanceLabels.forEach(label => {
        routeArray.slice(index + 1).forEach(routeOther => {
          routeOther.distanceLabels.forEach(labelOther => {
            // 同一地点の距離ラベルの場合、片方の距離ラベルを非表示にする
            if (label.position.equals(labelOther.position)) {
              label.setMap(null);
            }
          });
        });
      });
    });

    // 選択中ルートを表示
    if (this.selectedRoute) {
      let visible = document.getElementById(`route_item_${this.selectedRoute.routeId}`).getAttribute('data-visible');
      this.selectedRoute.displayMarkers(visible, {selected: true});
    }
  }

  /**
   * ルートのアニメーション
   */
  routeAnimation() {
    clearInterval(this.timerId);
    
    Object.values(this.routes).forEach(route => {
      route.routeLines.forEach(line => {
        line.setOptions({
          icons: []
        });
      })
    });

    let count = 0;
    let idx = 0;

    this.timerId = window.setInterval(() => {
      let line = this.selectedRoute.routeLines[idx];

      if (count == 0) {
        line.setOptions({
          icons: [
            {
              icon: {
                path: google.maps.SymbolPath.FORWARD_OPEN_ARROW,
                scale: 3,
                strokeColor: '#3CB371'
              },
              offset: '0%'
            }
          ]
        });
      }

      count = (count + 1) % 100;
      const icons = line.get('icons');
      icons[0].offset = (count) + '%';
      line.set('icons', icons);

      if (count >= 99) {
        count = 0;
        idx = idx + 1;

        line.setOptions({
          icons: []
        });

        if (idx >= this.selectedRoute.routeLines.length) {
          idx = 0;
        }
      }
    }, 5);
  }

  // -------------------
  // データの取得
  // -------------------
  /**
   * ロケーション情報を取得
   * @param {String} route_id - ルートID
   */
  static fetchLocations(route_id) {
    return fetch(`/locations/${route_id}`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        return data;
      });
  }
}

/**
 * Routeクラス
 * Map上に表示するルートを管理
 */
export class Route {
  static INVISIBLE = '0';
  static VISIBLE_ALL = '1';
  static VISIBLE_ROUTE = '2';

  constructor(routeId, map, routeMng) {
    this.routeId = routeId;
    this.map = map;
    this.routeMng = routeMng;
    this.dotMarkers = [];       // ドットマーカー
    this.distanceLabels = [];   // 距離ラベル
    this.routeLines = [];       // ルート線
    this.undoMng = new UndoManager(this);
  }

  /**
   * マーカーを追加
   */
  addMarker(position, options = {init: false, visibleNotYetSaveLabel: true, pushUndo: true}) {
    // ドットマーカーを作成
    const newDotMarker = this.routeMng.createDotMarker(this, {lat: position.lat(), lng: position.lng()});

    // 初期表示時、ドラッグ不可
    if (options.init) newDotMarker.setDraggable(false);
    
    // 未保存ラベルを表示
    if (options.visibleNotYetSaveLabel) this.visibleNotYetSaveLabel(true);

    // undo保持
    if (options.pushUndo) this.undoMng.push(UndoManager.ADD, newDotMarker.customId);

    // 配列にマーカーを追加
    this.dotMarkers.push(newDotMarker);
  
    // 2つ以上のマーカーがある場合は、新しく追加されたマーカーと前のマーカー間に直線を引く
    if (this.dotMarkers.length > 1) {
      // 前マーカー
      const prevDotMarker = this.dotMarkers[this.dotMarkers.length - 2];

      // ルート線を作成
      const routeLine = this.routeMng.createRouteLine(this, [prevDotMarker.position, newDotMarker.position]);    
      
      // ルート線を配列に追加
      this.routeLines.push(routeLine);

      // 距離ラベルを作成
      let distance = this.getDistanceBetweenMarkers(prevDotMarker, newDotMarker);
      const newDistanceLabel = this.routeMng.createDistanceLabel(position, distance);
      this.distanceLabels.push(newDistanceLabel);
      newDistanceLabel.labelContent = `${Math.round(this.getTotalDistance() * 1000)}m`;
    } else {
      // 先頭マーカーの場合
      // 距離ラベルを作成
      const newDistanceLabel = this.routeMng.createDistanceLabel(position, 0);
      this.distanceLabels.push(newDistanceLabel);
    }
  }

  /**
   * ルート線上にマーカーを追加
   */
  addMarkerOnLine(routeLine, position, options = {pushUndo: true}) {
    // admin有無
    const admin = document.querySelector('#admin')?.value == 'true';
    // ルート地点上限数チェック
    if (this.dotMarkers.length >= RouteManager.MAX_ROUTE_MARKER && !admin) {
      Common.showNotification(`ルート地点数が上限(${RouteManager.MAX_ROUTE_MARKER}地点)に達しました。`);
      return;
    }

    const routeId = routeLine.customId.split('-')[0];
    const routeLineIdx = routeLine.customId.split('-')[1];

    if (this.routeMng.selectedRoute?.routeId != routeId) return;

    for (let markerIdx = 0; markerIdx < this.dotMarkers.length; markerIdx++) {
      const dotMarkerIdx = this.dotMarkers[markerIdx].customId?.split('-')[1];

      if (dotMarkerIdx == routeLineIdx) {
        // ドットマーカーを作成
        const dotMarker = this.routeMng.createDotMarker(this, position);
        this.dotMarkers.splice(markerIdx + 1, 0, dotMarker);

        // ルート線を作成
        const routeLine = this.routeMng.createRouteLine(this, [this.dotMarkers[dotMarkerIdx].position, dotMarker.position]);   
        this.routeLines.splice(markerIdx + 1, 0, routeLine);

        // customIdを再設定
        for (let i = 0; i < this.dotMarkers.length; i++) {
          this.dotMarkers[i].customId = this.routeId + '-' + i;
        }
        for (let i = 0; i < this.routeLines.length; i++) {
          this.routeLines[i].customId = this.routeId + '-' + i;
        }
        // ルート線パスを再設定
        for (let i = 1; i < this.dotMarkers.length; i++) {
          this.routeLines[i - 1].setPath([this.dotMarkers[i - 1].position, this.dotMarkers[i].position]);
        }

        // undo保持
        if (options.pushUndo) this.undoMng.push(UndoManager.ADD, dotMarker.customId);

        // 距離ラベルを作成
        let distance = this.getDistanceBetweenMarkers(this.dotMarkers[dotMarkerIdx], dotMarker);
        const distanceLabel = this.routeMng.createDistanceLabel(position, distance);
        this.distanceLabels.splice(markerIdx + 1, 0, distanceLabel);
        distanceLabel.labelContent = `${Math.round((distance + (this.distanceLabels[dotMarkerIdx].labelContent.slice(0, -1) / 1000)) * 1000)}m`;

        break;
      }
    }

    // 未保存ラベルを表示
    this.visibleNotYetSaveLabel(true);
  }

  /**
   * 末尾マーカーを削除
   */
  delMarker() {
    if (this.dotMarkers.length) {
      this.removeMarker(this.dotMarkers[this.dotMarkers.length - 1], {pushUndo: false});
    }
  }

  /**
   * マーカーを削除
   */
  removeMarker(dotMarker, options = {pushUndo: true}) {
    const routeId = dotMarker.customId.split('-')[0];
    const dotMarkerIdx = dotMarker.customId.split('-')[1];

    if (this.routeMng.selectedRoute?.routeId != routeId) return;

    // ルート線を削除
    if (dotMarkerIdx == 0) {
      // 先頭マーカーの場合
      // undo保持
      if (options.pushUndo) this.undoMng.push(UndoManager.DEL, this.routeLines[dotMarkerIdx].customId, dotMarker.position, {head: true, tail: false});
      // ルート線を削除
      this.routeLines[dotMarkerIdx]?.setMap(null);
      this.routeLines?.splice(dotMarkerIdx, 1)
    } else if (dotMarkerIdx == this.dotMarkers.length - 1) {
      // 末尾マーカーの場合
      // undo保持
      if (options.pushUndo) this.undoMng.push(UndoManager.DEL, this.routeLines[dotMarkerIdx - 1].customId, dotMarker.position, {head: false, tail: true});
      // ルート線を削除
      this.routeLines[dotMarkerIdx - 1].setMap(null);
      this.routeLines.splice(dotMarkerIdx - 1, 1)
    } else {
      // 上記以外
      // undo保持
      if (options.pushUndo) this.undoMng.push(UndoManager.DEL, this.routeLines[dotMarkerIdx - 1].customId, dotMarker.position);
      // ルート線を削除
      this.routeLines[dotMarkerIdx].setMap(null);
      this.routeLines[dotMarkerIdx - 1].setPath([this.dotMarkers[dotMarkerIdx - 1].position, this.dotMarkers[Number(dotMarkerIdx) + 1].position]);
      this.routeLines.splice(dotMarkerIdx, 1)
    }

    // ドットマーカーを削除
    this.dotMarkers[dotMarkerIdx].setMap(null);
    this.dotMarkers.splice(dotMarkerIdx, 1)
    // 距離ラベルを削除
    this.distanceLabels[dotMarkerIdx].setMap(null);
    this.distanceLabels.splice(dotMarkerIdx, 1)

    // customIdを再設定
    for (let i = 0; i < this.dotMarkers.length; i++) {
      this.dotMarkers[i].customId = this.routeId + '-' + i;
    }
    for (let i = 0; i < this.routeLines.length; i++) {
      this.routeLines[i].customId = this.routeId + '-' + i;
    }

    // 距離ラベル値を更新
    for (let i = 0; i < this.distanceLabels.length; i++) {
      this.distanceLabels[i].distanceValue = 0;
      this.distanceLabels[i].labelContent = '0m';
    }
    this.distanceLabels[0]?.setMap(this.map);
    for (let i = 1; i < this.distanceLabels.length; i++) {
      let distance = this.getDistanceBetweenMarkers(this.dotMarkers[i - 1], this.dotMarkers[i]);
      this.distanceLabels[i].distanceValue = distance;
      this.distanceLabels[i].labelContent = `${Math.round(this.getTotalDistance() * 1000)}m`;
      this.distanceLabels[i].setMap(this.map);
    }

    // 未保存ラベルを表示
    this.visibleNotYetSaveLabel(true);
  }

  /**
   * 全てのマーカーを削除
   */
  clearMarkers() {
    this.dotMarkers.forEach((marker) => {
      marker.setMap(null);
    });

    this.distanceLabels.forEach((label) => {
      label.setMap(null);
    });

    this.routeLines.forEach((line) => {
      line.setMap(null);
    });

    this.dotMarkers = [];
    this.distanceLabels = [];
    this.routeLines = [];

    // undo初期化
    this.undoMng = new UndoManager(this);

    // 未保存ラベルを非表示
    this.visibleNotYetSaveLabel(false);
  }

  /**
   * マーカーを移動
   */
  moveMarker(dotMarker, movedPosition, prevPosition, options = {pushUndo: true}) {
    const routeId = dotMarker.customId.split('-')[0];
    const dotMarkerIdx = dotMarker.customId.split('-')[1];

    if (this.routeMng.selectedRoute?.routeId != routeId) return;

    // undo保持
    if (options.pushUndo) this.undoMng.push(UndoManager.MOVE, dotMarker.customId, prevPosition);

    if (!movedPosition) movedPosition = dotMarker.position;

    // ドットマーカーを移動
    this.dotMarkers[dotMarkerIdx].setPosition(movedPosition);

    // ルート線を移動
    if (dotMarkerIdx == 0) {
      // 先頭マーカードラッグ時
      this.routeLines[dotMarkerIdx]?.setPath([movedPosition, this.routeLines[dotMarkerIdx].getPath().getAt(1)]);
    } else if (dotMarkerIdx == this.dotMarkers.length - 1) {
      // 末尾マーカードラッグ時
      this.routeLines[dotMarkerIdx - 1].setPath([this.routeLines[dotMarkerIdx - 1].getPath().getAt(0), movedPosition]);
    } else {
      // 上記以外
      this.routeLines[dotMarkerIdx - 1].setPath([this.routeLines[dotMarkerIdx - 1].getPath().getAt(0), movedPosition]);
      this.routeLines[dotMarkerIdx].setPath([movedPosition, this.routeLines[dotMarkerIdx].getPath().getAt(1)]);
    }

    // 距離ラベルを移動
    this.distanceLabels[dotMarkerIdx].position = movedPosition;

    // 距離ラベル値を更新
    for (let i = 1; i < this.distanceLabels.length; i++) {
      this.distanceLabels[i].distanceValue = 0;
    }
    for (let i = 1; i < this.distanceLabels.length; i++) {
      let distance = this.getDistanceBetweenMarkers(this.dotMarkers[i - 1], this.dotMarkers[i]);
      this.distanceLabels[i].distanceValue = distance;
      this.distanceLabels[i].labelContent = `${Math.round(this.getTotalDistance() * 1000)}m`;
      this.distanceLabels[i].setMap(this.map);
    }

    // 未保存ラベルを表示
    this.visibleNotYetSaveLabel(true);
  }

  /**
   * 2つのマーカー間の距離（km）を返す
   */
  getDistanceBetweenMarkers(marker1, marker2) {
    const R = 6371; // 地球の半径（km）

    function toRadians(degrees) {
      return degrees * Math.PI / 180;
    }
    
    const lat1 = toRadians(marker1.position.lat());
    const lng1 = toRadians(marker1.position.lng());
    const lat2 = toRadians(marker2.position.lat());
    const lng2 = toRadians(marker2.position.lng());
  
    const dLat = lat2 - lat1;
    const dLng = lng2 - lng1;
  
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    const distance = R * c;
    return distance;
  }

  /**
   * 合計距離を返す
   */
  getTotalDistance() {
    return this.distanceLabels.reduce((sum, label) => sum + label.distanceValue, 0);
  }

  /**
   * マーカーを表示／非表示
   */
  displayMarkers(visible, options = {selected: false}) {

    // 初期化
    // ドットマーカー
    this.dotMarkers.forEach((marker) => {
      marker.setMap(null);
    });
    // 距離ラベル
    this.distanceLabels.forEach((label) => {
      label.setMap(null);
    });
    // ルート線
    this.routeLines.forEach((line) => {
      line.setMap(null);
    });

    switch (visible){
      // 非表示
      case Route.INVISIBLE:
        // 処理なし
        break;
      // 表示
      case Route.VISIBLE_ALL:
        // 選択ルート時のみ表示
        if (options.selected) {
          // ドットマーカー
          this.dotMarkers.forEach((marker) => {
            marker.setMap(this.map);
          });
        }

        // 距離ラベル
        if (this.distanceLabels.length) {
          // 先頭の距離ラベルを表示
          this.distanceLabels[0].setMap(this.map);
          // 末尾の距離ラベルを表示
          this.distanceLabels[this.distanceLabels.length - 1].setMap(this.map);

          // Nm単位で距離ラベルを表示
          let N = 0;
          if (this.routeMng.selectedRoute?.routeId == this.routeId) {
            // 選択ルートの場合
            if (this.map.getZoom() <= 14) N = 500;
            if (this.map.getZoom() <= 13) N = 1000;
          } else {
            // 未選択ルートの場合
            N = 1000;
          }
          if (this.map.getZoom() <= 11) N = 2000;
          if (this.map.getZoom() <= 10) N = 3000;
          if (this.map.getZoom() <= 9) N = 4000;

          if (N > 0) {
            // Nm単位で距離ラベルを表示
            let dispDistance = [];
            for (let i = 1; i <= 40000 / N; i++) {
              dispDistance.push({flg: false, distance: i * N});
            }

            this.distanceLabels.forEach(label => {
              dispDistance.forEach(d => {
                if (!d.flg) {
                  if (label.labelContent.slice(0, -1) / d.distance >= 1) {
                    label.setMap(this.map);
                    d.flg = true;
                  }
                  return;
                }
              });
            });
          } else {
            // 全ての距離ラベルを表示
            this.distanceLabels.forEach((label) => {
              label.setMap(this.map);
            });
          }
        }

        // ルート線
        this.routeLines.forEach((line) => {
          line.setMap(this.map);
        });
        break;
      // 表示(ルートのみ)
      case Route.VISIBLE_ROUTE:
        // ドットマーカー
        // this.dotMarkers.forEach((marker) => {
        //   marker.setMap(this.map);
        // });
        // 距離ラベル
        this.distanceLabels.forEach((label) => {
          label.setMap(null);
        });
        // ルート線
        this.routeLines.forEach((line) => {
          line.setMap(this.map);
        });
        break;
    }
  }

  /**
   * ルート活性／非活性
   */
  disableRoute(disable) {
    // ルート線色
    let routeColor;
    // 距離ラベル
    let distanceClass;
    // ドットマーカー
    let dotColor;

    // 選択ルート
    if (!disable) {
      routeColor = '#FF0000';
      distanceClass = 'distance-label';
      dotColor = '#3CB371';
    // 未選択ルート
    } else {
      routeColor = '#FF000055';
      distanceClass = 'distance-label distance-label-disable';
      dotColor = '#3CB37155';
    }

    // ルート線色
    this.routeLines.forEach(x => x.setOptions({strokeColor: routeColor}));
    // 距離ラベル
    this.distanceLabels.forEach(x => {
      if (!x.div) return;
      x.div.className = distanceClass;
    });
    // ドットマーカー
    this.dotMarkers.forEach(marker => {
      const newIcon = {
        ...marker.getIcon(),
        fillColor: dotColor
      };
      marker.setIcon(newIcon);
    });
  }

  /**
   * 未保存ラベル表示／非表示
   */
  visibleNotYetSaveLabel(visible) {
    // ルート一覧を取得
    const listItems = document.getElementById('routes').getElementsByClassName('route-item');

    let item = Object.values(listItems).filter(item => {
      let routeId = item.getAttribute('data-route-id');
      return this.routeId == routeId;
    })[0];

    if (visible) {
      item?.getElementsByClassName('label-not-yet-save')[0].classList.remove('hidden');
    } else {
      item?.getElementsByClassName('label-not-yet-save')[0].classList.add('hidden');
    }
  }
}

/**
 * 距離ラベルのオーバーレイ
 */
class DistanceLabelOverlay extends google.maps.OverlayView {
  constructor(map, position, labelContent, distanceValue) {
    super();
    this.map = map;
    this.position = position;
    this.labelContent = labelContent;
    this.distanceValue = distanceValue;
    this.setMap(map);
  }

  draw() {
    if (!this.div) {
      this.div = document.createElement('div');
      this.div.classList.add('distance-label');
      this.div.textContent = this.labelContent;
      this.getPanes().overlayLayer.appendChild(this.div);

      // 親要素のzIndexを削除
      this.div.parentNode.style.zIndex = null;

      // クリックイベントを処理
      google.maps.event.addDomListener(this.div, 'click', (event) => {
        // console.log("custom click");
        event.stopPropagation(); // マップの click イベントを停止
      });

      let panes = this.getPanes();
      panes.floatPane.appendChild(this.div);
    }
    const point = this.getProjection().fromLatLngToDivPixel(this.position);
    if (point) {
      this.div.style.left = (point.x - 30) + 'px';
      this.div.style.top = (point.y - 28) + 'px';
    }
  }

  onRemove() {
    if (this.div) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  }
}

/**
 * UndoManagerクラス
 */
class UndoManager {
  static ADD = '0';
  static DEL = '1';
  static MOVE = '2';

  constructor(route) {
    this.route = route;
    this.undoList = [];
  }

  push(undoDiv, customId, position = null, order = null) {
    this.undoList.push(
      {
        undoDiv: undoDiv,
        customId: customId,
        position: position,
        order: order
      }
    );
  }

  undo() {
    let undoInfo = this.undoList.pop();
    
    if (!undoInfo) {
      this.route.delMarker();
      return;
    }

    switch (undoInfo.undoDiv) {
      case UndoManager.ADD:
        // 追加マーカーを取消
        this.route.removeMarker(this.route.dotMarkers.filter(marker => marker.customId == undoInfo.customId)[0], {pushUndo: false});
        break;
      case UndoManager.DEL:
        // 削除マーカーを復元
        if (!undoInfo.order) {
          this.route.addMarkerOnLine(this.route.routeLines.filter(line => line.customId == undoInfo.customId)[0], undoInfo.position, {pushUndo: false});
        } else {
          if (undoInfo.order.head) {
            // 先頭マーカー
            this.route.addMarkerOnLine(this.route.routeLines[0], undoInfo.position, {pushUndo: true});
            let tmpPos = route.dotMarkers[0].position;
            this.route.moveMarker(this.route.dotMarkers[0], this.route.dotMarkers[1].position, {pushUndo: false});
            this.route.moveMarker(this.route.dotMarkers[1], tmpPos, {pushUndo: false});
          } else {
            // 末尾マーカー
            this.route.addMarker(undoInfo.position, {init: false, visibleNotYetSaveLabel: false, pushUndo: false});
          }
        }
        break;
      case UndoManager.MOVE:
        // 移動マーカーを移動前に戻す
        this.route.moveMarker(this.route.dotMarkers.filter(marker => marker.customId == undoInfo.customId)[0], undoInfo.position, null, {pushUndo: false});
        break;
    }
  }
}

/**
 * ルート一覧の並び替えを有効にする
 */
export function initSortable() {
  // SortableJS：Sortableオブジェクトを作成してリストの並び替えを有効にする
  const routesContainer = document.getElementById('routes-list');
  const sortable = new Sortable(routesContainer, {
    animation: 150,
    handle: '.drag-handle',   // ドラッグ可能な領域（ドラッグハンドル）を指定
    onEnd: (event) => {  // ドラッグ終了後の処理
      if (event.oldIndex === event.newIndex) return;

      const listItems = [...routesContainer.querySelectorAll('.route-item')];
      // ルートの並び順を更新
      postRouteOrder(listItems.map(item => item.getAttribute('data-route-id')));
    }
  });
}

/**
 * ルートの並び順を更新
 * @param {Array.<String>} routeIds - ルートID配列
 */
function postRouteOrder(routeIds) {
  // ルートの並び順を更新
  Common.postRequest(
    '/routes/order',
    {
      route_param: {
        routeIds: routeIds
      }
    }
  );
}
