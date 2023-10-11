class RoutesController < ApplicationController
  MAX_ROUTE = 10;          # 登録ルート上限数

  before_action :set_route, only: [:show, :edit, :update, :destroy]
  before_action :set_user, only: [:index, :create, :copy]

  # GET /routes
  # Route一覧を表示
  def index
    # ユーザーを取得できなかった場合
    if !@user
      # ユーザーを新規作成
      @user = User.new
      @user.password = "tmp_password"
      @user.save

      cookies.delete(:user_id)
      cookies.delete(:remember_token)
    end

    cookies.permanent.encrypted[:user_token] = @user.user_token

    # 最終ログイン日時を更新
    @user.update_last_login_at

    # Route情報を取得
    @routes = Route.where(user_id: @user.id).order(:order, created_at: :desc)
    @route = Route.new
    @route.user_id = @user.id
    
    respond_to do |format|
      format.html # HTML形式のビューを表示
      format.json { render json: @routes.to_json() } # JSON形式でデータを返す
    end
  end

  # GET /routes/1
  def show
  end

  # GET /routes/new
  def new
    @route = Route.new
  end

  # GET /routes/1/edit
  def edit
  end

  # POST /routes
  # Route新規登録
  def create
    # ルート上限数チェック
    if invalid_create_route
      flash.now.notice = "ルート数が上限(#{MAX_ROUTE}ルート)に達しました。"
      return
    end

    @route = Route.new(route_params_create)
    @route.user_id = @user.id
    @route.order = 0

    if @route.save
      # flash[:info] = "登録しました"
      # redirect_to routes_url
      flash.now.notice = "登録しました"
    else
      render :new, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /routes/1
  # Route情報更新
  def update
    if @route.update(route_params_update)
      # flash[:success] = "更新しました"
      # redirect_to routes_url
      # redirect_to @route, notice: "更新しました"
      flash.now.notice = "更新しました"
    else
      render :edit, status: :unprocessable_entity
    end
  end

  # DELETE /routes/1
  # Route情報削除
  def destroy
    @route.destroy
    # flash[:success] = "削除しました"
    # redirect_to routes_url, status: :see_other
    flash.now.notice = "削除しました"
  end

  # Route情報コピー新規登録
  def copy
    # ルート上限数チェック
    if invalid_create_route
      flash.now.notice = "ルート数が上限(#{MAX_ROUTE}ルート)に達しました。"
      return
    end
    
    # コピー元のRouteを取得
    @org_route = Route.find(params[:route][:id])

    # Routeを複製
    new_route = @org_route.dup
    new_route.name += "_コピー"
    new_route.order = 0

    # コピー元のRouteに紐づくLocationモデルを複製して、新しいRouteに紐づける
    new_route.locations = @org_route.locations.map { |location| location.dup }

    # 新しいRouteを新規登録
    if new_route.save
      # flash[:success] = "コピーしました"
      # redirect_to routes_url
      @route = new_route
      flash.now.notice = "コピーしました"
    else
      render 'index'
    end
  end

  # Routeのルート表示区分を更新
  def visible
    route_param = params[:route_param]

    @route = Route.find(route_param[:routeId])
    @route.visible = route_param[:visible]
    unless @route.save
      render json: { result: 'Failure' }
    end

    render json: { result: 'Success' }
  end

  # Routeの並び順を更新
  def order
    route_param = params[:route_param]

    route_param[:routeIds].each_with_index do |routeId, index|
      @route = Route.find(routeId)
      @route.order = index + 1
      unless @route.save
        render json: { result: 'Failure' }
      end
    end

    render json: { result: 'Success' }
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_route
      @route = Route.find(params[:id])
    end

    def set_user
      @user = current_user

      # 未ログインの場合
      if !@user
        # ユーザートークンが保持されている場合
        if (user_token = cookies.encrypted[:user_token])
          # ユーザートークンからユーザーを取得
          @user = User.find_by(user_token: user_token)
        end
      end
    end

    # ルート登録時のストロングパラメータ
    def route_params_create
      params.require(:route).permit(:name, :user_id, :order)
    end

    # ルート登録時のストロングパラメータ
    def route_params_update
      params.require(:route).permit(:name)
    end

    # ルート上限数チェック。無効な場合、true
    def invalid_create_route
      return Route.where(user_id: @user.id).count >= MAX_ROUTE && !@user.admin
    end
end
