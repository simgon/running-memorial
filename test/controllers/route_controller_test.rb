require "test_helper"

class RouteControllerTest < ActionDispatch::IntegrationTest
  def setup
    @user = users(:user1)
    @route = routes(:route1)
    cookies[:user_id] = @user.id
  end

  test "should get new" do
    get routes_path
    assert_response :success
  end

  test "should get index" do
    get routes_path
    assert_response :success
    assert_not_nil assigns(:user)
    assert_not_nil assigns(:routes)
    assert_not_nil assigns(:route)
  end

  test "should create route" do
    assert_difference('Route.count', 1) do
      post routes_path, params: { route: { name: 'New Route', user_id: @user.id } }
    end
    assert_redirected_to routes_url
  end

  test "should update route" do
    patch route_path(@route), params: { id: @route.id, route: { name: 'Updated Route' } }
    assert_redirected_to routes_url
  end

  test "should destroy route" do
    assert_difference('Route.count', -1) do
      delete route_path(@route)
    end
    assert_redirected_to routes_url
  end

  test "should copy route" do
    assert_difference('Route.count', 1) do
      post "/routes/copy", params: { route: { id: @route.id } }
    end
    assert_redirected_to routes_url
  end

  test "should update route visibility" do
    post "/routes/visible", params: { route_param: { routeId: @route.id, visible: '0' } }
    assert_response :success
    assert_equal 'Success', JSON.parse(response.body)['message']
  end

  test "should update route order" do
    route_ids = @user.routes.pluck(:id)
    post "/routes/order", params: { route_param: { routeIds: route_ids } }
    assert_response :success
    assert_equal 'Success', JSON.parse(response.body)['message']
  end
end
