require "test_helper"

class RouteControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = users(:user1)
    @route = routes(:route1)
    cookies[:user_id] = @user.id
    cookies[:user_token] = @user.user_token
  end

  test "should get index" do
    get routes_path
    assert_response :success
  end

  test "should not create route when user has reached the maximum number of routes" do
    # ユーザーがルート上限に達している場合
    @user = users(:user_with_max_routes)
    cookies[:user_id] = @user.id
    cookies[:user_token] = @user.user_token
    assert_no_difference('Route.count') do
      post routes_path, params: { route: { name: 'New Route', user_id: @user.id }, format: "" }
    end
    assert_equal "ルート数が上限(#{RoutesController::MAX_ROUTE}ルート)に達しました。", flash.now[:notice]
  end
  
  test "should create route when user has not reached the maximum number of routes" do
    # ユーザーがルート上限に達していない場合
    # @user = users(:user_with_less_routes)
    assert_difference('Route.count', 1) do
      post routes_path, params: { route: { name: 'New Route', user_id: @user.id }, format: "" }
    end
    assert_equal "登録しました", flash.now[:notice]
  end

  test "should update route name" do
    patch route_path(@route), params: { id: @route.id, route: { name: 'Updated Route' }, format: "" }
    assert_equal "更新しました", flash.now[:notice]
  end

  test "should destroy route with ajax" do
    assert_difference('Route.count', -1) do
      delete route_path(@route), xhr: true
    end
    assert_response :success
  end

  test "should copy route with ajax" do
    assert_difference('Route.count', 1) do
      post "/routes/copy", params: { route: { id: @route.id } }, xhr: true
    end
    assert_response :success
  end

  test "should update route visibility with ajax" do
    post "/routes/visible", params: { route_param: { routeId: @route.id, visible: '0' } }, xhr: true
    assert_response :success
  end

  test "should update route order with ajax" do
    route_ids = @user.routes.pluck(:id)
    post "/routes/order", params: { route_param: { routeIds: route_ids } }, xhr: true
    assert_response :success
  end
end
